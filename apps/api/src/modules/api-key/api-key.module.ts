import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { ApiKeyController } from './api-key.controller';
import { ApiKeyService } from './api-key.service';
import { ApiKeyRepository } from './api-key.repository';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [ApiKeyController],
  providers: [ApiKeyService, ApiKeyRepository, ApiKeyGuard, LoggerService],
  exports: [ApiKeyService, ApiKeyGuard],
})
export class ApiKeyModule {}
