import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { PayrollRepository } from '../payroll.repository';
import { generatePayslipPdf, PayslipData } from './payslip.template';
import { generateForm16Pdf, Form16Data } from './form16.template';
import { generateW2Pdf, W2Data } from './w2.template';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly algorithm = 'aes-256-cbc';
  private readonly encryptionKey: string;

  constructor(
    private readonly repository: PayrollRepository,
    private readonly configService: ConfigService,
  ) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key) {
      throw new Error('ENCRYPTION_KEY is not configured');
    }
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

  // ─── Payslip PDF ────────────────────────────────────────────────────────────

  async generatePayslip(payrollId: string, companyId: string): Promise<Buffer> {
    const payroll = await this.repository.findById(payrollId);
    if (!payroll || payroll.companyId !== companyId) {
      throw new NotFoundException('Payroll record not found');
    }

    const company = await this.repository.findCompany(companyId);
    if (!company) throw new NotFoundException('Company not found');

    const employee = await this.repository.findEmployee(payroll.employeeId, companyId);
    if (!employee) throw new NotFoundException('Employee not found');

    const country = payroll.country || 'IN';
    const currency = country === 'IN' ? '₹' : '$';
    const grossSalary = this.safeDecrypt(payroll.grossSalaryEncrypted);
    const netSalary = this.safeDecrypt(payroll.netSalaryEncrypted);

    // Build earnings list
    const earnings: Array<{ name: string; amount: number }> = [];
    const earningsBreakdown = payroll.earningsBreakdown as Record<string, number> || {};

    if (Object.keys(earningsBreakdown).length > 0) {
      for (const [key, val] of Object.entries(earningsBreakdown)) {
        if (!key.startsWith('deduction:')) {
          earnings.push({ name: key, amount: val as number });
        }
      }
    } else {
      // Fallback for manual payroll
      earnings.push({ name: 'Basic Salary', amount: this.safeDecrypt(payroll.basicSalaryEncrypted) });
      if (payroll.hraEncrypted) earnings.push({ name: 'HRA', amount: this.safeDecrypt(payroll.hraEncrypted) });
      if (payroll.specialAllowanceEncrypted) earnings.push({ name: 'Special Allowance', amount: this.safeDecrypt(payroll.specialAllowanceEncrypted) });
      if (payroll.otherAllowancesEncrypted) earnings.push({ name: 'Other Allowances', amount: this.safeDecrypt(payroll.otherAllowancesEncrypted) });
    }

    // Build deductions list
    const deductions: Array<{ name: string; amount: number }> = [];
    const employerContributions: Array<{ name: string; amount: number }> = [];
    let totalDeductions = 0;
    let totalEmployerContrib = 0;

    const toNum = (val: any): number => parseFloat(val?.toString() || '0');

    if (country === 'IN') {
      if (toNum(payroll.pfEmployee) > 0) {
        deductions.push({ name: 'PF (Employee)', amount: toNum(payroll.pfEmployee) });
        totalDeductions += toNum(payroll.pfEmployee);
      }
      if (toNum(payroll.esiEmployee) > 0) {
        deductions.push({ name: 'ESI (Employee)', amount: toNum(payroll.esiEmployee) });
        totalDeductions += toNum(payroll.esiEmployee);
      }
      if (toNum(payroll.tds) > 0) {
        deductions.push({ name: 'TDS', amount: toNum(payroll.tds) });
        totalDeductions += toNum(payroll.tds);
      }
      if (toNum(payroll.pt) > 0) {
        deductions.push({ name: 'Professional Tax', amount: toNum(payroll.pt) });
        totalDeductions += toNum(payroll.pt);
      }
      if (toNum(payroll.pfEmployer) > 0) {
        employerContributions.push({ name: 'PF (Employer)', amount: toNum(payroll.pfEmployer) });
        totalEmployerContrib += toNum(payroll.pfEmployer);
      }
      if (toNum(payroll.esiEmployer) > 0) {
        employerContributions.push({ name: 'ESI (Employer)', amount: toNum(payroll.esiEmployer) });
        totalEmployerContrib += toNum(payroll.esiEmployer);
      }
    } else {
      if (toNum(payroll.ssEmployee) > 0) {
        deductions.push({ name: 'Social Security', amount: toNum(payroll.ssEmployee) });
        totalDeductions += toNum(payroll.ssEmployee);
      }
      if (toNum(payroll.medicareEmployee) > 0) {
        deductions.push({ name: 'Medicare', amount: toNum(payroll.medicareEmployee) });
        totalDeductions += toNum(payroll.medicareEmployee);
      }
      if (toNum(payroll.federalTax) > 0) {
        deductions.push({ name: 'Federal Tax', amount: toNum(payroll.federalTax) });
        totalDeductions += toNum(payroll.federalTax);
      }
      if (toNum(payroll.stateTax) > 0) {
        deductions.push({ name: 'State Tax', amount: toNum(payroll.stateTax) });
        totalDeductions += toNum(payroll.stateTax);
      }
      if (toNum(payroll.ssEmployer) > 0) {
        employerContributions.push({ name: 'SS (Employer)', amount: toNum(payroll.ssEmployer) });
        totalEmployerContrib += toNum(payroll.ssEmployer);
      }
      if (toNum(payroll.medicareEmployer) > 0) {
        employerContributions.push({ name: 'Medicare (Employer)', amount: toNum(payroll.medicareEmployer) });
        totalEmployerContrib += toNum(payroll.medicareEmployer);
      }
    }

    if (toNum(payroll.otherDeductions) > 0) {
      deductions.push({ name: 'Other Deductions', amount: toNum(payroll.otherDeductions) });
      totalDeductions += toNum(payroll.otherDeductions);
    }

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const payslipData: PayslipData = {
      companyName: company.companyName,
      companyPan: this.safeDecryptStr(company.companyPanEncrypted),
      companyEin: this.safeDecryptStr(company.einEncrypted),
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeCode: employee.employeeCode,
      pan: this.safeDecryptStr(employee.panEncrypted),
      uan: this.safeDecryptStr(employee.uanEncrypted),
      ssn: this.safeDecryptStr(employee.ssnEncrypted),
      bankAccount: payroll.bankAccountEncrypted ? this.safeDecryptStr(payroll.bankAccountEncrypted) : undefined,
      bankName: payroll.bankName ?? undefined,
      payPeriod: `${monthNames[payroll.payPeriodMonth - 1]} ${payroll.payPeriodYear}`,
      payDate: payroll.payDate?.toISOString().split('T')[0],
      country,
      earnings,
      deductions,
      employerContributions,
      grossSalary,
      totalDeductions,
      netSalary,
      totalEmployerContributions: totalEmployerContrib,
      daysWorked: payroll.daysWorked,
      daysInMonth: payroll.daysInMonth,
      leaveDays: payroll.leaveDays,
      absentDays: payroll.absentDays,
      currency,
    };

    const pdfDoc = generatePayslipPdf(payslipData);
    return this.pdfToBuffer(pdfDoc);
  }

  // ─── Form 16 PDF (India) ────────────────────────────────────────────────────

  async generateForm16(
    employeeId: string,
    fiscalYear: number,
    companyId: string,
  ): Promise<Buffer> {
    const company = await this.repository.findCompany(companyId);
    if (!company) throw new NotFoundException('Company not found');

    const employee = await this.repository.findEmployee(employeeId, companyId);
    if (!employee) throw new NotFoundException('Employee not found');

    // Get YTD data
    const ytd = await this.repository.findYtd(companyId, employeeId, fiscalYear);
    if (!ytd) throw new NotFoundException('No YTD data found for this fiscal year');

    // Get payroll records for the fiscal year (April to March)
    const payrolls = await this.repository.findEmployeePayrolls(companyId, employeeId);
    const fyPayrolls = payrolls.filter((p: any) => {
      if (p.payPeriodMonth >= 4) return p.payPeriodYear === fiscalYear;
      return p.payPeriodYear === fiscalYear + 1;
    });

    // Calculate quarterly TDS
    const quarters = [
      { name: 'Q1 (Apr-Jun)', months: [4, 5, 6] },
      { name: 'Q2 (Jul-Sep)', months: [7, 8, 9] },
      { name: 'Q3 (Oct-Dec)', months: [10, 11, 12] },
      { name: 'Q4 (Jan-Mar)', months: [1, 2, 3] },
    ];

    const quarterlyTds = quarters.map(q => {
      const qPayrolls = fyPayrolls.filter((p: any) => q.months.includes(p.payPeriodMonth));
      const tds = qPayrolls.reduce((sum: number, p: any) => sum + parseFloat(p.tds?.toString() || '0'), 0);
      return { quarter: q.name, tdsDeducted: tds, tdsDeposited: tds };
    });

    const annualIncome = this.safeDecrypt(ytd.grossEarningsEncrypted);
    const totalTds = parseFloat(ytd.tdsYtd?.toString() || '0');
    const taxRegime = employee.taxRegime || 'NEW';
    const stdDeduction = taxRegime === 'NEW' ? 75000 : 50000;
    const taxableIncome = Math.max(0, annualIncome - stdDeduction);

    const form16Data: Form16Data = {
      companyName: company.companyName,
      companyPan: this.safeDecryptStr(company.companyPanEncrypted),
      companyTan: '', // TAN not in select, add if needed
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeCode: employee.employeeCode,
      pan: this.safeDecryptStr(employee.panEncrypted),
      uan: this.safeDecryptStr(employee.uanEncrypted),
      fiscalYear: `${fiscalYear}-${(fiscalYear + 1).toString().slice(-2)}`,
      assessmentYear: `${fiscalYear + 1}-${(fiscalYear + 2).toString().slice(-2)}`,
      quarterlyTds,
      annualIncome,
      standardDeduction: stdDeduction,
      taxableIncome,
      taxOnIncome: 0, // Simplified; in production, re-run slab calculation
      rebate87A: 0,
      cess: 0,
      totalTaxLiability: totalTds,
      totalTdsDeducted: totalTds,
      taxRegime,
    };

    const pdfDoc = generateForm16Pdf(form16Data);
    return this.pdfToBuffer(pdfDoc);
  }

  // ─── W-2 PDF (US) ──────────────────────────────────────────────────────────

  async generateW2(
    employeeId: string,
    taxYear: number,
    companyId: string,
  ): Promise<Buffer> {
    const company = await this.repository.findCompany(companyId);
    if (!company) throw new NotFoundException('Company not found');

    const employee = await this.repository.findEmployee(employeeId, companyId);
    if (!employee) throw new NotFoundException('Employee not found');

    const ytd = await this.repository.findYtd(companyId, employeeId, taxYear);
    if (!ytd) throw new NotFoundException('No YTD data found for this tax year');

    const grossEarnings = this.safeDecrypt(ytd.grossEarningsEncrypted);

    const w2Data: W2Data = {
      employerName: company.companyName,
      employerEin: this.safeDecryptStr(company.einEncrypted),
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeSsn: `***-**-${this.safeDecryptStr(employee.ssnEncrypted).slice(-4) || '0000'}`,
      taxYear,
      box1WagesTips: grossEarnings,
      box2FederalTaxWithheld: parseFloat(ytd.federalTaxYtd?.toString() || '0'),
      box3SsWages: Math.min(grossEarnings, 176100), // SS wage base cap
      box4SsTaxWithheld: parseFloat(ytd.ssEmployeeYtd?.toString() || '0'),
      box5MedicareWages: grossEarnings,
      box6MedicareTaxWithheld: parseFloat(ytd.medicareYtd?.toString() || '0') / 2, // Employee portion only
      box7SsTips: 0,
      box12Codes: [],
      box15State: employee.state || '',
      box16StateWages: grossEarnings,
      box17StateTaxWithheld: parseFloat(ytd.stateTaxYtd?.toString() || '0'),
      currency: '$',
    };

    const pdfDoc = generateW2Pdf(w2Data);
    return this.pdfToBuffer(pdfDoc);
  }

  // ─── Helper ─────────────────────────────────────────────────────────────────

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
