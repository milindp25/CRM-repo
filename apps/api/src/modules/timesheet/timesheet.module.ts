import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { TimesheetController } from './timesheet.controller';
import { TimesheetService } from './timesheet.service';
import { TimesheetRepository } from './timesheet.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [TimesheetController],
  providers: [TimesheetService, TimesheetRepository, LoggerService],
  exports: [TimesheetService],
})
export class TimesheetModule {}
