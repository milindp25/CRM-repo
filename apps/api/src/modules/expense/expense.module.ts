import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { ExpenseController } from './expense.controller';
import { ExpenseService } from './expense.service';
import { ExpenseRepository } from './expense.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [ExpenseController],
  providers: [ExpenseService, ExpenseRepository, LoggerService],
  exports: [ExpenseService],
})
export class ExpenseModule {}
