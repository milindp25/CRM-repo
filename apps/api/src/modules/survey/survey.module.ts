import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { SurveyController } from './survey.controller';
import { SurveyService } from './survey.service';
import { SurveyRepository } from './survey.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [SurveyController],
  providers: [SurveyService, SurveyRepository, LoggerService],
  exports: [SurveyService],
})
export class SurveyModule {}
