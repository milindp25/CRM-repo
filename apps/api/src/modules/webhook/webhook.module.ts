import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookRepository } from './webhook.repository';
import { WebhookListener } from './webhook.listener';

@Module({
  imports: [DatabaseModule],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookRepository, WebhookListener, LoggerService],
  exports: [WebhookService],
})
export class WebhookModule {}
