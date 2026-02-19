import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { WorkflowRepository } from './workflow.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [WorkflowController],
  providers: [WorkflowService, WorkflowRepository, LoggerService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
