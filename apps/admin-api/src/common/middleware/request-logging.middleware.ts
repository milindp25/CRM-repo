import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    if (req.originalUrl.includes('/health')) {
      return next();
    }

    const startTime = Date.now();
    const { method, originalUrl } = req;
    const correlationId = (req as any).correlationId || 'unknown';

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const logMessage = `${method} ${originalUrl} ${statusCode} ${duration}ms (cid:${String(correlationId).substring(0, 8)})`;

      if (statusCode >= 500) {
        this.logger.error(logMessage);
      } else if (statusCode >= 400 || duration > 1000) {
        this.logger.warn(logMessage);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
