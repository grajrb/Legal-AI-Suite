/**
 * Sanitization utilities for handling user input safely
 * Prevents XSS attacks and other security vulnerabilities
 */

// HTML entity map for escaping
const htmlEntityMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
};

/**
 * Escape HTML special characters to prevent XSS
 */
export const escapeHtml = (text: string | null | undefined): string => {
  if (!text) return '';
  return String(text).replace(/[&<>"'\/]/g, (char) => htmlEntityMap[char]);
};

/**
 * Remove potentially dangerous scripts and HTML tags
 */
export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input) return '';
  
  let sanitized = String(input);
  
  // Remove script tags and content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remove style tags (but not style attributes)
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  return sanitized.trim();
};

/**
 * Trim and validate string input
 */
export const sanitizeString = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return sanitizeInput(value).trim();
};

/**
 * Sanitize email address
 */
export const sanitizeEmail = (email: string | null | undefined): string => {
  if (!email) return '';
  return sanitizeString(email).toLowerCase().trim();
};

/**
 * Sanitize object recursively (for API payloads)
 */
export const sanitizeObject = <T extends Record<string, unknown>>(
  obj: T
): T => {
  const sanitized = { ...obj };
  
  Object.keys(sanitized).forEach((key) => {
    const value = sanitized[key];
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => {
        if (typeof item === 'string') {
          return sanitizeInput(item);
        } else if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item as Record<string, unknown>);
        }
        return item;
      });
    }
  });
  
  return sanitized;
};

/**
 * Validate and sanitize file name
 */
export const sanitizeFileName = (fileName: string | null | undefined): string => {
  if (!fileName) return 'document.pdf';
  
  // Remove path components
  const name = String(fileName).split(/[\/\\]/).pop() || 'document.pdf';
  
  // Remove special characters except dots, hyphens, and underscores
  const sanitized = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  return sanitized.substring(0, 255);
};

/**
 * Validate URL is safe (prevent open redirect)
 */
export const isValidRedirectUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    // Only allow relative URLs or same-origin URLs
    if (url.startsWith('/')) return true;
    if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
      return true;
    }
    // Add your domain here
    if (url.startsWith(window.location.origin)) return true;
    return false;
  } catch {
    return false;
  }
};

/**
 * Sanitize for SQL (prevent basic SQL injection in client-side)
 * Note: Always use parameterized queries on backend
 */
export const sanitizeSqlInput = (input: string): string => {
  if (!input) return '';
  
  let sanitized = sanitizeString(input);
  
  // Basic protection - remove common SQL keywords/patterns
  sanitized = sanitized.replace(/['";]/g, (char) => {
    if (char === "'") return "''";
    return '';
  });
  
  return sanitized;
};
