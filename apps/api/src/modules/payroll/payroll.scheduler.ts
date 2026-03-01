import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../database/prisma.service';
import { PayrollService } from './payroll.service';

@Injectable()
export class PayrollScheduler {
  private readonly logger = new Logger(PayrollScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payrollService: PayrollService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoGeneratePayroll() {
    const today = new Date().getDate();
    this.logger.log(`Running daily payroll check (day ${today})`);

    try {
      const companies = await this.prisma.company.findMany({
        where: {
          payrollAutoGenerate: true,
          payrollAutoDay: today,
        },
        select: { id: true, companyName: true },
      });

      if (companies.length === 0) {
        this.logger.log('No companies scheduled for auto-payroll today');
        return;
      }

      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      for (const company of companies) {
        try {
          // Check if batch already exists for this month
          const existingBatch = await this.prisma.payrollBatch.findUnique({
            where: {
              companyId_month_year: {
                companyId: company.id,
                month: currentMonth,
                year: currentYear,
              },
            },
          });

          if (existingBatch) {
            this.logger.log(
              `Batch already exists for ${company.companyName} (${currentMonth}/${currentYear}), skipping`,
            );
            continue;
          }

          this.logger.log(
            `Auto-generating payroll for ${company.companyName} (${currentMonth}/${currentYear})`,
          );
          const batch = await this.payrollService.batchProcess(
            company.id,
            currentMonth,
            currentYear,
            'SYSTEM', // system-generated
          );

          // Emit event for notifications
          this.eventEmitter.emit('payroll.auto.generated', {
            companyId: company.id,
            batchId: batch.id,
            month: currentMonth,
            year: currentYear,
            count: batch.totalCount,
          });

          this.logger.log(
            `Auto-generated payroll batch for ${company.companyName}: ${batch.processedCount}/${batch.totalCount} processed`,
          );
        } catch (error: any) {
          this.logger.error(
            `Failed to auto-generate payroll for ${company.companyName}: ${error.message}`,
          );
        }
      }
    } catch (error: any) {
      this.logger.error(`Payroll scheduler error: ${error.message}`);
    }
  }
}
