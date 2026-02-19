import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../services/logger.service';

/**
 * HTTP request/response logging middleware.
 * Logs every request with method, URL, status, duration, and correlation ID.
 * Skips health check endpoints to reduce noise.
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Skip health checks to avoid log noise
    if (req.originalUrl.includes('/health')) {
      return next();
    }

    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const correlationId = (req as any).correlationId || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    // Set correlation ID on logger for this request scope
    this.logger.setCorrelationId(correlationId);

    this.logger.debug(
      `→ ${method} ${originalUrl}`,
      'HTTP',
    );

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const contentLength = res.get('content-length') || '0';

      const logMessage = `← ${method} ${originalUrl} ${statusCode} ${duration}ms ${contentLength}b`;

      if (statusCode >= 500) {
        this.logger.error(logMessage, undefined, 'HTTP');
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage, 'HTTP');
      } else if (duration > 1000) {
        // Highlight slow requests (>1s)
        this.logger.warn(`SLOW ${logMessage}`, 'HTTP');
      } else {
        this.logger.log(logMessage, 'HTTP');
      }
    });

    next();
  }
}
