import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { RecruitmentController } from './recruitment.controller';
import { RecruitmentService } from './recruitment.service';
import { RecruitmentRepository } from './recruitment.repository';
import { OfferLetterService } from './pdf/offer-letter.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RecruitmentController],
  providers: [RecruitmentService, RecruitmentRepository, LoggerService, OfferLetterService],
  exports: [RecruitmentService],
})
export class RecruitmentModule {}
