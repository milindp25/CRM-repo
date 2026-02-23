import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { LeavePolicyController } from './leave-policy.controller';
import { LeavePolicyService } from './leave-policy.service';
import { LeavePolicyRepository } from './leave-policy.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [LeavePolicyController],
  providers: [LeavePolicyService, LeavePolicyRepository, LoggerService],
  exports: [LeavePolicyService],
})
export class LeavePolicyModule {}
