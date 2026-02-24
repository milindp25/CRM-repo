import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    const TIMEOUT_MS = 10_000;
    try {
      await Promise.race([
        this.$connect(),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error(`DB connection timed out after ${TIMEOUT_MS}ms`)),
            TIMEOUT_MS,
          ),
        ),
      ]);
      this.logger.log('Database connected successfully');
    } catch (error) {
      // Don't throw — let the app start so Render/cloud health checks pass.
      // Prisma will attempt lazy reconnection on the first query.
      this.logger.warn(
        `Database connection failed at startup — app will retry on first query: ${(error as Error).message}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  // Helper method for clean test transactions
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'production') {
      // Add cleanup logic for tests
      this.logger.warn('Database cleanup called');
    }
  }
}
