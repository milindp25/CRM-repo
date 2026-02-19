import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { LoggerService } from '../services/logger.service';

/**
 * Logging interceptor that tracks request execution time.
 * Works in conjunction with RequestLoggingMiddleware for full observability.
 *
 * Logs:
 * - Controller/handler name being invoked
 * - Execution duration (warns if > 1000ms)
 * - Unhandled errors with stack traces
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const className = context.getClass().name;
    const handlerName = context.getHandler().name;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        if (duration > 1000) {
          this.logger.warn(
            `SLOW ${className}.${handlerName} - ${duration}ms`,
            'Performance',
          );
        }
      }),
      catchError((err) => {
        const duration = Date.now() - startTime;
        this.logger.error(
          `${className}.${handlerName} failed after ${duration}ms: ${err.message}`,
          err.stack,
          'LoggingInterceptor',
        );
        return throwError(() => err);
      }),
    );
  }
}
