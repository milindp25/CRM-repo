import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator.js';

/**
 * Health Controller (Admin API)
 * Provides health check endpoints for Render / load balancer monitoring.
 *
 * @SkipThrottle() - Health checks are excluded from rate limiting
 * so that Render/Kubernetes probes are never blocked by ThrottlerGuard.
 */
@SkipThrottle({ default: true })
@ApiTags('health')
@Controller({
  path: 'health',
  version: '1',
})
export class HealthController {
  /**
   * Basic health check
   * Returns overall service status
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Check Admin API health status' })
  @ApiResponse({
    status: 200,
    description: 'Health check successful',
    schema: {
      example: {
        status: 'ok',
        service: 'admin-api',
        timestamp: '2025-01-15T10:30:00.000Z',
        uptime: 12345.678,
      },
    },
  })
  check() {
    return {
      status: 'ok',
      service: 'admin-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Simple ping endpoint
   */
  @Public()
  @Get('ping')
  @ApiOperation({ summary: 'Simple ping endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Pong response',
    schema: {
      example: {
        message: 'pong',
        timestamp: '2025-01-15T10:30:00.000Z',
      },
    },
  })
  ping() {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
    };
  }
}
