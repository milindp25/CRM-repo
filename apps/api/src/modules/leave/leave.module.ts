import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { LeaveRepository } from './leave.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [LeaveController],
  providers: [LeaveService, LeaveRepository, LoggerService],
  exports: [LeaveService],
})
export class LeaveModule {}
