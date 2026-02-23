import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { ContractorController } from './contractor.controller';
import { ContractorService } from './contractor.service';
import { ContractorRepository } from './contractor.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [ContractorController],
  providers: [ContractorService, ContractorRepository, LoggerService],
  exports: [ContractorService],
})
export class ContractorModule {}
