import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ImportExportController } from './import-export.controller';
import { ImportExportService } from './import-export.service';
import { CsvService } from '../../common/services/csv.service';

/**
 * Import/Export Module
 * Provides bulk data import (CSV upload) and export (CSV download) capabilities.
 *
 * Features:
 * - Employee import from CSV with row-level validation
 * - CSV template download for import
 * - Employee, attendance, leave, and department CSV exports
 *
 * Uses Multer with memory storage for file uploads (no disk temp files).
 * CsvService provides manual CSV parsing/generation without external packages.
 */
@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  controllers: [ImportExportController],
  providers: [ImportExportService, CsvService],
  exports: [ImportExportService, CsvService],
})
export class ImportExportModule {}
