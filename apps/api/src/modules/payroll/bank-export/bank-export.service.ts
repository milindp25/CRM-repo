import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDecipheriv } from 'crypto';
import { PayrollRepository } from '../payroll.repository';

/**
 * Bank File Export Service
 *
 * Generates bank transfer files in standard formats:
 * - India: NEFT/RTGS CSV file
 * - US: NACHA ACH file (simplified)
 */
@Injectable()
export class BankExportService {
  private readonly logger = new Logger(BankExportService.name);
  private readonly algorithm = 'aes-256-cbc';
  private readonly encryptionKey: string;

  constructor(
    private readonly repository: PayrollRepository,
    private readonly configService: ConfigService,
  ) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key) throw new Error('ENCRYPTION_KEY is not configured');
    this.encryptionKey = key.substring(0, 64);
  }

  private decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const key = Buffer.from(this.encryptionKey, 'hex');
    const decipher = createDecipheriv(this.algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  private safeDecrypt(val: string | null | undefined): number {
    if (!val) return 0;
    try { return parseFloat(this.decrypt(val)); } catch { return 0; }
  }

  private safeDecryptStr(val: string | null | undefined): string {
    if (!val) return '';
    try { return this.decrypt(val); } catch { return ''; }
  }

  /**
   * Generate bank file for a payroll batch.
   * Auto-detects NEFT or ACH based on company's payrollCountry.
   */
  async generateBankFile(
    batchId: string,
    companyId: string,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const batch = await this.repository.findBatchById(batchId);
    if (!batch || batch.companyId !== companyId) {
      throw new NotFoundException('Payroll batch not found');
    }

    const company = await this.repository.findCompany(companyId);
    if (!company) throw new NotFoundException('Company not found');

    const payrolls = await this.repository.findPayrollsByBatch(batchId);

    if (company.payrollCountry === 'US') {
      return this.generateACH(payrolls, company, batch);
    }
    return this.generateNEFT(payrolls, company, batch);
  }

  /**
   * Generate NEFT/RTGS bank transfer file (CSV format).
   * Standard format accepted by most Indian banks:
   * Beneficiary Name, Account Number, IFSC Code, Amount, Narration
   */
  private async generateNEFT(payrolls: any[], company: any, batch: any): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const lines: string[] = [];
    lines.push('Beneficiary Name,Account Number,IFSC Code,Amount,Narration');

    for (const payroll of payrolls) {
      if (payroll.status !== 'PROCESSED' && payroll.status !== 'PAID') continue;

      const name = payroll.employee
        ? `${payroll.employee.firstName} ${payroll.employee.lastName}`
        : 'Unknown';
      const accountNo = payroll.bankAccountEncrypted ? this.safeDecryptStr(payroll.bankAccountEncrypted) : '';
      const ifsc = payroll.ifscCodeEncrypted ? this.safeDecryptStr(payroll.ifscCodeEncrypted) : '';
      const netSalary = this.safeDecrypt(payroll.netSalaryEncrypted);
      const narration = `Salary ${batch.month}/${batch.year} - ${name}`;

      // Escape CSV fields
      lines.push(
        `"${name}","${accountNo}","${ifsc}",${netSalary.toFixed(2)},"${narration}"`,
      );
    }

    const csv = lines.join('\n');
    const filename = `NEFT_${company.companyName.replace(/\s+/g, '_')}_${batch.month}_${batch.year}.csv`;

    return {
      buffer: Buffer.from(csv, 'utf-8'),
      filename,
      contentType: 'text/csv',
    };
  }

  /**
   * Generate simplified ACH/NACHA file for US payroll.
   * This is a CSV approximation — real NACHA requires fixed-width format.
   */
  private async generateACH(payrolls: any[], company: any, batch: any): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const lines: string[] = [];
    lines.push('Employee Name,Routing Number,Account Number,Amount,Transaction Code,Company Name');

    for (const payroll of payrolls) {
      if (payroll.status !== 'PROCESSED' && payroll.status !== 'PAID') continue;

      const name = payroll.employee
        ? `${payroll.employee.firstName} ${payroll.employee.lastName}`
        : 'Unknown';
      const routingNo = payroll.routingNumberEncrypted ? this.safeDecryptStr(payroll.routingNumberEncrypted) : '';
      const accountNo = payroll.bankAccountEncrypted ? this.safeDecryptStr(payroll.bankAccountEncrypted) : '';
      const netSalary = this.safeDecrypt(payroll.netSalaryEncrypted);

      lines.push(
        `"${name}","${routingNo}","${accountNo}",${netSalary.toFixed(2)},22,"${company.companyName}"`,
      );
    }

    const csv = lines.join('\n');
    const filename = `ACH_${company.companyName.replace(/\s+/g, '_')}_${batch.month}_${batch.year}.csv`;

    return {
      buffer: Buffer.from(csv, 'utf-8'),
      filename,
      contentType: 'text/csv',
    };
  }
}
