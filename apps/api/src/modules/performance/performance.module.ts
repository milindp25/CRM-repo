import { Module } from '@nestjs/common';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { PerformanceRepository } from './performance.repository';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';

/**
 * Performance Module
 * Encapsulates all performance management functionality:
 * - Review Cycles (create, activate, complete)
 * - Performance Reviews (self-review, manager review)
 * - Goals / OKRs (create, track progress)
 */
@Module({
  imports: [
    DatabaseModule, // Provides PrismaService
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService, PerformanceRepository, LoggerService],
  exports: [PerformanceService], // Export for use in other modules
})
export class PerformanceModule {}
