import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { BillingRepository } from './billing.repository.js';
import { BillingPdfService } from './pdf/billing-pdf.service.js';

@Module({
  controllers: [BillingController],
  providers: [BillingService, BillingRepository, BillingPdfService],
  exports: [BillingService],
})
export class BillingModule {}
