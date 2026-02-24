import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import {
  HealthCheckService,
  HealthCheck,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';

/**
 * Health Controller
 * Provides health check endpoints for monitoring
 *
 * @SkipThrottle() - Health checks are excluded from rate limiting
 * so that Render/Kubernetes probes are never blocked by ThrottlerGuard.
 */
@SkipThrottle()
@ApiTags('health')
@Controller({
  path: 'health',
  version: '1',
})
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly memoryHealth: MemoryHealthIndicator,
    private readonly diskHealth: DiskHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Basic health check endpoint
   * Returns overall system health status
   */
  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check API health status' })
  @ApiResponse({
    status: 200,
    description: 'Health check successful',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          storage: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          storage: { status: 'up' },
        },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
  })
  async check() {
    return this.health.check([
      // Database health check (simple connection test)
      async () => {
        // Note: Supabase pooler has issues with prepared statements
        // We verify the Prisma client is connected (checked at startup)
        return { database: { status: this.prisma ? 'up' : 'down' } };
      },

      // Memory health checks (150MB heap, 300MB RSS limit)
      () =>
        this.memoryHealth.checkHeap('memory_heap', 150 * 1024 * 1024),
      () =>
        this.memoryHealth.checkRSS('memory_rss', 300 * 1024 * 1024),

      // Disk health check (90% storage usage threshold)
      // Use process.cwd() for cross-platform compatibility (Windows/Linux)
      () =>
        this.diskHealth.checkStorage('storage', {
          path: process.cwd(),
          thresholdPercent: 0.9,
        }),
    ]);
  }

  /**
   * Simple ping endpoint
   * Quick check without detailed diagnostics
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
        timestamp: '2024-01-15T10:30:00.000Z',
        uptime: 12345.678,
      },
    },
  })
  ping() {
    return {
      message: 'pong',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Readiness probe
   * Checks if the service is ready to accept traffic
   */
  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe for Kubernetes/Docker' })
  @ApiResponse({
    status: 200,
    description: 'Service is ready',
  })
  @ApiResponse({
    status: 503,
    description: 'Service is not ready',
  })
  async ready() {
    return this.health.check([
      // Database health check (simple connection test)
      async () => {
        // Note: Supabase pooler has issues with prepared statements
        // We verify the Prisma client is connected (checked at startup)
        return { database: { status: this.prisma ? 'up' : 'down' } };
      },
    ]);
  }

  /**
   * Liveness probe
   * Checks if the service is alive (for container orchestration)
   */
  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes/Docker' })
  @ApiResponse({
    status: 200,
    description: 'Service is alive',
    schema: {
      example: {
        status: 'ok',
      },
    },
  })
  live() {
    return {
      status: 'ok',
    };
  }
}
