import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { OffboardingController } from './offboarding.controller';
import { OffboardingService } from './offboarding.service';
import { OffboardingRepository } from './offboarding.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [OffboardingController],
  providers: [OffboardingService, OffboardingRepository, LoggerService],
  exports: [OffboardingService],
})
export class OffboardingModule {}
