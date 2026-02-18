import { Module } from '@nestjs/common';
import { DesignationController } from './designation.controller';
import { DesignationService } from './designation.service';
import { DesignationRepository } from './designation.repository';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  imports: [DatabaseModule],
  controllers: [DesignationController],
  providers: [DesignationService, DesignationRepository, LoggerService],
  exports: [DesignationService],
})
export class DesignationModule {}
