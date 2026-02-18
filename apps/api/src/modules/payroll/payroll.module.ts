import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { PayrollRepository } from './payroll.repository';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [PayrollController],
  providers: [PayrollService, PayrollRepository, LoggerService],
  exports: [PayrollService],
})
export class PayrollModule {}
