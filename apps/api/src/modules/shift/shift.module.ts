import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { ShiftController } from './shift.controller';
import { ShiftService } from './shift.service';
import { ShiftRepository } from './shift.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [ShiftController],
  providers: [ShiftService, ShiftRepository, LoggerService],
  exports: [ShiftService],
})
export class ShiftModule {}
