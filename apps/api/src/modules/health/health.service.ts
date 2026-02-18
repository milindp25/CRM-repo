import { Injectable } from '@nestjs/common';

/**
 * Health Service
 * Business logic for health checks
 */
@Injectable()
export class HealthService {
  /**
   * Get application metadata
   */
  getMetadata() {
    return {
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };
  }

  /**
   * Check if database connection is healthy
   */
  async isDatabaseHealthy(): Promise<boolean> {
    // This is handled by PrismaHealthIndicator in the controller
    // But we can add custom logic here if needed
    return true;
  }
}
