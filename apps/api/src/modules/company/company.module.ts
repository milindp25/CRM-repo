import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { CompanyRepository } from './company.repository';
import { DatabaseModule } from '../../database/database.module';
import { CacheService } from '../../common/services/cache.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CompanyController],
  providers: [CompanyService, CompanyRepository, CacheService],
  exports: [CompanyService],
})
export class CompanyModule {}
