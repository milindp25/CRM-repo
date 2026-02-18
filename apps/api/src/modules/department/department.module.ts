import { Module } from '@nestjs/common';
import { DepartmentController } from './department.controller';
import { DepartmentService } from './department.service';
import { DepartmentRepository } from './department.repository';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';

/**
 * Department Module
 * Encapsulates all department management functionality
 */
@Module({
  imports: [DatabaseModule],
  controllers: [DepartmentController],
  providers: [DepartmentService, DepartmentRepository, LoggerService, CacheService],
  exports: [DepartmentService],
})
export class DepartmentModule {}
