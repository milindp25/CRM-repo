import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../services/logger.service';
import { AppException } from '../exceptions';

/**
 * Global exception filter with structured error responses.
 *
 * Produces consistent error envelope:
 * {
 *   success: false,
 *   error: {
 *     statusCode: 404,
 *     errorCode: "RESOURCE_NOT_FOUND",
 *     message: "Employee not found",
 *     correlationId: "abc-123",
 *     timestamp: "...",
 *     path: "/v1/employees/123",
 *     details: { ... }    // optional
 *   }
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = (request as any).correlationId || 'unknown';

    let status: number;
    let message: string;
    let errorCode: string;
    let details: Record<string, unknown> | undefined;

    if (exception instanceof AppException) {
      // Custom application exceptions (have error codes)
      status = exception.getStatus();
      message = exception.message;
      errorCode = exception.errorCode;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      // Standard NestJS HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) || exception.message;
      }
      errorCode = this.statusToErrorCode(status);
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      // Prisma validation errors (e.g., invalid UUID passed to where clause)
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid request parameters';
      errorCode = 'VALIDATION_ERROR';
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma known errors (e.g., unique constraint violations, record not found)
      if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Resource already exists';
        errorCode = 'RESOURCE_CONFLICT';
      } else if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        message = 'Resource not found';
        errorCode = 'RESOURCE_NOT_FOUND';
      } else if (exception.code === 'P2003') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference - related resource not found';
        errorCode = 'VALIDATION_ERROR';
      } else if (exception.code === 'P2023') {
        // Inconsistent column data (e.g., non-UUID string passed as UUID)
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid ID format';
        errorCode = 'VALIDATION_ERROR';
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Database error occurred';
        errorCode = 'INTERNAL_ERROR';
      }
    } else {
      // Unhandled exceptions (programming errors)
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
      errorCode = 'INTERNAL_ERROR';
    }

    // Log with appropriate severity
    const logContext = 'ExceptionFilter';
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status} [${errorCode}] ${message}`,
        exception instanceof Error ? exception.stack : undefined,
        logContext,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} ${status} [${errorCode}] ${message}`,
        logContext,
      );
    }

    const errorResponse = {
      success: false,
      error: {
        statusCode: status,
        errorCode,
        message,
        correlationId,
        timestamp: new Date().toISOString(),
        path: request.url,
        ...(details && { details }),
      },
    };

    response.status(status).json(errorResponse);
  }

  private statusToErrorCode(status: number): string {
    const map: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'AUTHENTICATION_ERROR',
      403: 'AUTHORIZATION_ERROR',
      404: 'RESOURCE_NOT_FOUND',
      409: 'RESOURCE_CONFLICT',
      422: 'BUSINESS_LOGIC_ERROR',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_ERROR',
      502: 'EXTERNAL_SERVICE_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };
    return map[status] || 'UNKNOWN_ERROR';
  }
}
