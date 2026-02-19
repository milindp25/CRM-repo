import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base application exception with error code support.
 * All custom exceptions extend this for consistent error responses.
 */
export class AppException extends HttpException {
  public readonly errorCode: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    errorCode: string,
    status: HttpStatus,
    details?: Record<string, unknown>,
  ) {
    super({ message, errorCode, details }, status);
    this.errorCode = errorCode;
    this.details = details;
  }
}

// ── Authentication Exceptions (401) ────────────────────────────────

export class AuthenticationException extends AppException {
  constructor(message = 'Authentication required', errorCode = 'AUTHENTICATION_ERROR') {
    super(message, errorCode, HttpStatus.UNAUTHORIZED);
  }
}

export class InvalidCredentialsException extends AuthenticationException {
  constructor() {
    super('Invalid email or password', 'INVALID_CREDENTIALS');
  }
}

export class TokenExpiredException extends AuthenticationException {
  constructor() {
    super('Token has expired', 'TOKEN_EXPIRED');
  }
}

export class TokenInvalidException extends AuthenticationException {
  constructor() {
    super('Invalid token', 'TOKEN_INVALID');
  }
}

// ── Authorization Exceptions (403) ─────────────────────────────────

export class AuthorizationException extends AppException {
  constructor(message = 'Access denied', errorCode = 'AUTHORIZATION_ERROR') {
    super(message, errorCode, HttpStatus.FORBIDDEN);
  }
}

export class InsufficientPermissionsException extends AuthorizationException {
  constructor(permission?: string) {
    super(
      permission
        ? `Missing required permission: ${permission}`
        : 'Insufficient permissions for this action',
      'INSUFFICIENT_PERMISSIONS',
    );
  }
}

export class FeatureNotAvailableException extends AuthorizationException {
  constructor(feature?: string) {
    super(
      feature
        ? `Feature "${feature}" is not available on your current plan`
        : 'This feature is not available on your current plan',
      'FEATURE_NOT_AVAILABLE',
    );
  }
}

export class SubscriptionExpiredException extends AuthorizationException {
  constructor() {
    super('Your subscription has expired. Please renew to continue.', 'SUBSCRIPTION_EXPIRED');
  }
}

// ── Resource Exceptions (404, 409) ─────────────────────────────────

export class ResourceNotFoundException extends AppException {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with ID "${id}" not found` : `${resource} not found`,
      'RESOURCE_NOT_FOUND',
      HttpStatus.NOT_FOUND,
      { resource, id },
    );
  }
}

export class ResourceConflictException extends AppException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'RESOURCE_CONFLICT', HttpStatus.CONFLICT, details);
  }
}

// ── Validation Exceptions (400) ────────────────────────────────────

export class ValidationException extends AppException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', HttpStatus.BAD_REQUEST, details);
  }
}

// ── Business Logic Exceptions (422) ────────────────────────────────

export class BusinessLogicException extends AppException {
  constructor(message: string, errorCode = 'BUSINESS_LOGIC_ERROR', details?: Record<string, unknown>) {
    super(message, errorCode, HttpStatus.UNPROCESSABLE_ENTITY, details);
  }
}

export class InsufficientLeaveBalanceException extends BusinessLogicException {
  constructor() {
    super('Insufficient leave balance for this request', 'INSUFFICIENT_LEAVE_BALANCE');
  }
}

// ── Rate Limiting Exceptions (429) ─────────────────────────────────

export class RateLimitException extends AppException {
  constructor(retryAfterMs?: number) {
    super(
      'Too many requests. Please try again later.',
      'RATE_LIMIT_EXCEEDED',
      HttpStatus.TOO_MANY_REQUESTS,
      retryAfterMs ? { retryAfterMs } : undefined,
    );
  }
}

// ── External Service Exceptions (502) ──────────────────────────────

export class ExternalServiceException extends AppException {
  constructor(serviceName: string, message?: string) {
    super(
      message || `External service "${serviceName}" is unavailable`,
      'EXTERNAL_SERVICE_ERROR',
      HttpStatus.BAD_GATEWAY,
      { serviceName },
    );
  }
}
