import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { randomUUID } from 'crypto';

/**
 * Enterprise-grade structured logging service with correlation ID support.
 *
 * Features:
 * - Correlation IDs for distributed request tracing
 * - Structured JSON output in production (for ELK, Datadog, CloudWatch)
 * - Human-readable colorized output in development
 * - Sensitive data redaction
 * - Duration-aware logging for performance monitoring
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private correlationId: string | null = null;

  private static readonly SENSITIVE_FIELDS = [
    'password', 'token', 'secret', 'authorization', 'cookie',
    'creditCard', 'ssn', 'apiKey', 'accessToken', 'refreshToken',
  ];

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
      defaultMeta: {
        service: process.env.SERVICE_NAME || 'hrplatform-api',
        environment: process.env.NODE_ENV || 'development',
      },
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.errors({ stack: true }),
      ),
      transports: [
        new winston.transports.Console({
          format: isProduction
            ? winston.format.combine(winston.format.json())
            : winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, context, correlationId: cid, duration, ...rest }) => {
                  const ctx = context ? `[${context}]` : '';
                  const cidStr = cid ? ` (cid:${String(cid).substring(0, 8)})` : '';
                  const dur = duration !== undefined ? ` ${duration}ms` : '';
                  // Remove winston default meta from rest for cleaner dev output
                  const { service, environment, ...meta } = rest;
                  const extra = Object.keys(meta).length > 0
                    ? ` ${JSON.stringify(meta)}`
                    : '';
                  return `${timestamp} ${level} ${ctx}${cidStr}${dur} ${message}${extra}`;
                }),
              ),
        }),
      ],
    });
  }

  setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  getCorrelationId(): string {
    if (!this.correlationId) {
      this.correlationId = randomUUID();
    }
    return this.correlationId;
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context, correlationId: this.correlationId });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context, correlationId: this.correlationId });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context, correlationId: this.correlationId });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context, correlationId: this.correlationId });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context, correlationId: this.correlationId });
  }

  /**
   * Log with structured metadata (for machine-parseable context)
   */
  info(message: string, meta?: Record<string, unknown>, context?: string) {
    this.logger.info(message, {
      context,
      correlationId: this.correlationId,
      ...LoggerService.redactSensitive(meta ?? {}),
    });
  }

  /**
   * Log with explicit duration tracking (for performance monitoring)
   */
  logWithDuration(message: string, durationMs: number, context?: string, meta?: Record<string, unknown>) {
    this.logger.info(message, {
      context,
      correlationId: this.correlationId,
      duration: durationMs,
      ...meta,
    });
  }

  /**
   * Redact sensitive fields from metadata objects
   */
  static redactSensitive(obj: Record<string, unknown>): Record<string, unknown> {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (LoggerService.SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        redacted[key] = LoggerService.redactSensitive(value as Record<string, unknown>);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }
}
