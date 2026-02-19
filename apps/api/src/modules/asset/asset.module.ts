import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';
import { AssetRepository } from './asset.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [AssetController],
  providers: [AssetService, AssetRepository, LoggerService],
  exports: [AssetService],
})
export class AssetModule {}
