import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { EmployeeRepository } from './employee.repository';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';

/**
 * Employee Module
 * Encapsulates all employee management functionality
 * Following NestJS module architecture for clean separation
 */
@Module({
  imports: [
    DatabaseModule, // Provides PrismaService
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService, EmployeeRepository, LoggerService],
  exports: [EmployeeService], // Export for use in other modules
})
export class EmployeeModule {}
