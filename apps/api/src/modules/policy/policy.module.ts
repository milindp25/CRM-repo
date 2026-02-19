import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { PolicyController } from './policy.controller';
import { PolicyService } from './policy.service';
import { PolicyRepository } from './policy.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [PolicyController],
  providers: [PolicyService, PolicyRepository, LoggerService],
  exports: [PolicyService],
})
export class PolicyModule {}
