import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { LeaveRepository } from './leave.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [LeaveController],
  providers: [LeaveService, LeaveRepository, LoggerService, CacheService],
  exports: [LeaveService],
})
export class LeaveModule {}
