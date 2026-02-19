import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter with structured error responses and correlation IDs.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = (request as any).correlationId || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        message = (resp.message as string) || message;
        errorCode = (resp.errorCode as string) || this.statusToErrorCode(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled error: ${exception.message} (cid:${correlationId})`,
        exception.stack,
      );
    }

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} ${status} [${errorCode}] ${message}`);
    } else if (status >= 400) {
      this.logger.warn(`${request.method} ${request.url} ${status} [${errorCode}] ${message}`);
    }

    response.status(status).json({
      success: false,
      error: {
        statusCode: status,
        errorCode,
        message,
        correlationId,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }

  private statusToErrorCode(status: number): string {
    const map: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'AUTHENTICATION_ERROR',
      403: 'AUTHORIZATION_ERROR',
      404: 'RESOURCE_NOT_FOUND',
      409: 'RESOURCE_CONFLICT',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_ERROR',
    };
    return map[status] || 'UNKNOWN_ERROR';
  }
}
