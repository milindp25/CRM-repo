/**
 * Generic API Success Response
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp?: string;
}

/**
 * API Error Details
 */
export interface ApiErrorDetails {
  field?: string;
  message: string;
  [key: string]: any;
}

/**
 * Generic API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    statusCode: number;
    message: string;
    code: string;
    details?: ApiErrorDetails | ApiErrorDetails[];
  };
  timestamp?: string;
}

/**
 * API Response Type (Success or Error)
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Pagination Metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
