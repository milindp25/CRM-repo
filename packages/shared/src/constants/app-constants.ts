/**
 * Application-wide Constants
 */

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * JWT Token Configuration
 */
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '7d',
  REFRESH_TOKEN_EXPIRY: '30d',
  ALGORITHM: 'HS256',
} as const;

/**
 * Password Configuration
 */
export const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: false,
  BCRYPT_ROUNDS: 10,
} as const;

/**
 * File Upload Limits
 */
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

/**
 * Date Formats
 */
export const DATE_FORMATS = {
  DATE: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME: 'HH:mm:ss',
  DISPLAY_DATE: 'DD MMM YYYY',
  DISPLAY_DATETIME: 'DD MMM YYYY, HH:mm',
} as const;

/**
 * Audit Log Retention
 */
export const AUDIT_LOG = {
  RETENTION_DAYS: 2555, // 7 years
  SENSITIVE_FIELDS: ['password', 'passwordHash', 'token', 'secret'],
} as const;

/**
 * Rate Limiting
 */
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  SKIP_SUCCESSFUL_REQUESTS: false,
} as const;

/**
 * API Versioning
 */
export const API_VERSION = {
  CURRENT: 'v1',
  SUPPORTED: ['v1'],
} as const;
