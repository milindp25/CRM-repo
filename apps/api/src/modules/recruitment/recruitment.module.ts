import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { RecruitmentController } from './recruitment.controller';
import { RecruitmentService } from './recruitment.service';
import { RecruitmentRepository } from './recruitment.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [RecruitmentController],
  providers: [RecruitmentService, RecruitmentRepository, LoggerService],
  exports: [RecruitmentService],
})
export class RecruitmentModule {}
