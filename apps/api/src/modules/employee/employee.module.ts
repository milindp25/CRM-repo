import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { EmployeeRepository } from './employee.repository';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';
import { StorageService } from '../../common/services/storage.service';

/**
 * Employee Module
 * Encapsulates all employee management functionality
 * Following NestJS module architecture for clean separation
 */
@Module({
  imports: [
    DatabaseModule, // Provides PrismaService
    MulterModule.register({ storage: require('multer').memoryStorage() }),
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService, EmployeeRepository, LoggerService, CacheService, StorageService],
  exports: [EmployeeService], // Export for use in other modules
})
export class EmployeeModule {}
