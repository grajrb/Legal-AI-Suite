import { z } from 'zod';

// Email validation schema
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email must be less than 255 characters');

// Password validation schema
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password must be less than 128 characters');

// User registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be less than 100 characters'),
  role: z.enum(['user', 'admin', 'lawyer', 'paralegal']),
  organization: z.string().max(255, 'Organization must be less than 255 characters').optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// User login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 50 * 1024 * 1024, 'File must be less than 50MB')
    .refine((file) => file.type === 'application/pdf', 'Only PDF files are allowed'),
  documentName: z
    .string()
    .min(1, 'Document name is required')
    .max(255, 'Document name must be less than 255 characters')
    .optional(),
});

// Chat query validation
export const chatQuerySchema = z.object({
  question: z
    .string()
    .min(1, 'Question cannot be empty')
    .max(1000, 'Question must be less than 1000 characters'),
  documentId: z.string().min(1, 'Document ID is required'),
  sessionId: z.string().optional(),
});

// Matter creation schema
export const matterSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters'),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional(),
  status: z.enum(['Pending', 'Active', 'Completed', 'On Hold']),
  deadline: z.string().optional(),
  assignedTo: z.string().optional(),
});

// Types exported from schemas
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;
export type ChatQueryData = z.infer<typeof chatQuerySchema>;
export type MatterData = z.infer<typeof matterSchema>;

// Utility function to safely parse and validate data
export const validateFormData = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: Record<string, string> } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
      }
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};
