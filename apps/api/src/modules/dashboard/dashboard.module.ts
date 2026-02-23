import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './dashboard.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository, LoggerService],
  exports: [DashboardService],
})
export class DashboardModule {}
