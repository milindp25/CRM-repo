import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { StorageService } from '../../common/services/storage.service';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { DocumentRepository } from './document.repository';

@Module({
  imports: [
    DatabaseModule,
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [DocumentController],
  providers: [DocumentService, DocumentRepository, StorageService, LoggerService],
  exports: [DocumentService],
})
export class DocumentModule {}
