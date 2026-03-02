import { Injectable, NotFoundException } from '@nestjs/common';
import { BillingRepository } from '../billing.repository.js';
import { generateInvoicePdf, InvoiceData } from './invoice.template.js';

@Injectable()
export class BillingPdfService {
  constructor(private readonly repository: BillingRepository) {}

  async generateInvoicePdf(invoiceId: string): Promise<Buffer> {
    const invoice = await this.repository.findInvoiceById(invoiceId);
    if (!invoice) {
      throw new NotFoundException(`Invoice ${invoiceId} not found`);
    }

    const company = invoice.companyBilling?.company;
    const plan = invoice.companyBilling?.billingPlan;

    const lineItems = (invoice.lineItems as any[]) || [];

    const invoiceData: InvoiceData = {
      companyName: company?.companyName || 'Unknown Company',
      companyCode: company?.companyCode || '',
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: this.formatDate(invoice.issuedAt),
      dueDate: this.formatDate(invoice.dueDate),
      periodStart: this.formatDate(invoice.periodStart),
      periodEnd: this.formatDate(invoice.periodEnd),
      status: invoice.status,
      planName: plan?.name || 'N/A',
      billingCycle: invoice.companyBilling?.billingCycle || 'MONTHLY',
      employeeCount: invoice.employeeCount,
      userCount: invoice.userCount,
      baseAmount: Number(invoice.baseAmount),
      employeeAmount: Number(invoice.employeeAmount),
      userAmount: Number(invoice.userAmount),
      addonAmount: Number(invoice.addonAmount),
      totalAmount: Number(invoice.totalAmount),
      lineItems: lineItems.map((item: any) => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        amount: item.amount || 0,
      })),
      paidAt: invoice.paidAt ? this.formatDate(invoice.paidAt) : undefined,
    };

    const pdfDoc = generateInvoicePdf(invoiceData);
    return this.pdfToBuffer(pdfDoc);
  }

  private formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private pdfToBuffer(doc: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }
}
