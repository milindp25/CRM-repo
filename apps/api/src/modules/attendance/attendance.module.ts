import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceRepository } from './attendance.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceRepository, LoggerService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
