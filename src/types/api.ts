// src/types/api.ts

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
