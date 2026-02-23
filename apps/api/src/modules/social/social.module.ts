import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { SocialRepository } from './social.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [SocialController],
  providers: [SocialService, SocialRepository, LoggerService],
  exports: [SocialService],
})
export class SocialModule {}
