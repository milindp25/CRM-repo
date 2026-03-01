import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { CompanyRepository } from './company.repository';
import { DatabaseModule } from '../../database/database.module';
import { CacheService } from '../../common/services/cache.service';
import { StorageService } from '../../common/services/storage.service';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  imports: [
    DatabaseModule,
    MulterModule.register({ storage: require('multer').memoryStorage() }),
  ],
  controllers: [CompanyController],
  providers: [CompanyService, CompanyRepository, CacheService, StorageService, LoggerService],
  exports: [CompanyService],
})
export class CompanyModule {}
