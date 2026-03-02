import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';
import { PayrollRepository } from './payroll.repository';
import { DatabaseModule } from '../../database/database.module';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';
import { IndianTaxEngine } from './tax-engines/indian-tax.engine';
import { USTaxEngine } from './tax-engines/us-tax.engine';
import { TaxEngineFactory } from './tax-engines/tax-engine.factory';
import { SalaryStructureController } from './salary-structure/salary-structure.controller';
import { SalaryStructureService } from './salary-structure/salary-structure.service';
import { SalaryStructureRepository } from './salary-structure/salary-structure.repository';
import { PdfService } from './pdf/pdf.service';
import { BankExportService } from './bank-export/bank-export.service';
import { StatutoryReportService } from './reports/statutory-report.service';
import { StorageService } from '../../common/services/storage.service';
import { PayrollScheduler } from './payroll.scheduler';

@Module({
  imports: [DatabaseModule, ConfigModule, EventEmitterModule],
  controllers: [SalaryStructureController, PayrollController],
  providers: [
    PayrollService,
    PayrollRepository,
    LoggerService,
    CacheService,
    // Tax engines
    IndianTaxEngine,
    USTaxEngine,
    TaxEngineFactory,
    // Salary structure
    SalaryStructureService,
    SalaryStructureRepository,
    // PDF generation + storage
    PdfService,
    StorageService,
    // Bank export
    BankExportService,
    // Statutory reports
    StatutoryReportService,
    // Scheduler
    PayrollScheduler,
  ],
  exports: [PayrollService, TaxEngineFactory, PdfService],
})
export class PayrollModule {}
