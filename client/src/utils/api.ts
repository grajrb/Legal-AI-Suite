import axios, { AxiosError, AxiosInstance } from 'axios';

// API Error type
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code: string = 'API_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Standard API Response type
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

// API Client class
class ApiClient {
  private instance: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.instance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to all requests
    this.instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle responses and errors
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<any>) => {
        // Extract error message from various possible formats
        let message = 'An error occurred';
        let code = 'UNKNOWN_ERROR';
        let details = undefined;
        
        if (error.response?.data) {
          const data = error.response.data;
          
          // Check for FastAPI error format: { "detail": "message" }
          if (typeof data.detail === 'string') {
            message = data.detail;
          }
          // Check for wrapped error format: { "error": { "message": "...", "code": "..." } }
          else if (data.error?.message) {
            message = data.error.message;
            code = data.error.code || code;
            details = data.error.details;
          }
          // Fallback to error message
          else if (typeof data === 'string') {
            message = data;
          }
        } else if (error.message) {
          message = error.message;
        }
        
        const status = error.response?.status || 500;
        throw new ApiError(status, message, code, details);
      }
    );
  }

  async get<T = unknown>(url: string, params?: Record<string, unknown>) {
    const response = await this.instance.get<T>(url, { params });
    return response.data;
  }

  async post<T = unknown>(url: string, data?: unknown) {
    const response = await this.instance.post<T>(url, data);
    return response.data;
  }

  async put<T = unknown>(url: string, data?: unknown) {
    const response = await this.instance.put<T>(url, data);
    return response.data;
  }

  async delete<T = unknown>(url: string) {
    const response = await this.instance.delete<T>(url);
    return response.data;
  }

  async uploadFile<T = unknown>(url: string, file: File, additionalData?: Record<string, string>) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await this.instance.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.success) {
      throw new ApiError(400, response.data.error?.message || 'Upload failed');
    }
    return response.data.data;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Utility to handle errors gracefully
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Utility to extract field errors from API response
export const extractFieldErrors = (error: unknown): Record<string, string> => {
  if (error instanceof ApiError && error.details && typeof error.details === 'object') {
    const details = error.details as Record<string, unknown>;
    const fieldErrors: Record<string, string> = {};
    
    Object.entries(details).forEach(([key, value]) => {
      if (typeof value === 'string') {
        fieldErrors[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        fieldErrors[key] = String(value[0]);
      }
    });
    
    return fieldErrors;
  }
  return {};
};
