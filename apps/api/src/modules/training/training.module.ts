import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';
import { TrainingRepository } from './training.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [TrainingController],
  providers: [
    TrainingService,
    TrainingRepository,
    LoggerService,
  ],
  exports: [TrainingService],
})
export class TrainingModule {}
