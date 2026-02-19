import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Correlation ID middleware.
 * Assigns a unique ID to every incoming request for distributed tracing.
 * If the caller sends an x-correlation-id header, it is reused (propagation).
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || randomUUID();
    (req as any).correlationId = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    next();
  }
}
