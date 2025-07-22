export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T | null;
  error: string | null;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface QueryParams {
  [key: string]: string | number | boolean | string[] | number[] | undefined;
}
