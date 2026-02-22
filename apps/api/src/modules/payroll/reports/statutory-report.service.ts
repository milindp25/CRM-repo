import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDecipheriv } from 'crypto';
import { PayrollRepository } from '../payroll.repository';

/**
 * Statutory Report Service
 *
 * Generates compliance reports for filing:
 * India: Form 24Q (quarterly TDS), PF ECR (monthly), ESI contribution sheet
 * US: Form 941 (quarterly federal tax), State tax reports
 */
@Injectable()
export class StatutoryReportService {
  private readonly logger = new Logger(StatutoryReportService.name);
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
    const key = Buffer.from(this.encryptionKey, 'hex');
    const decipher = createDecipheriv(this.algorithm, key, iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
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

  // ═══════════════════════════════════════════════════════════════════════════════
  // INDIA REPORTS
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Form 24Q — Quarterly TDS Return
   * CSV format matching TRACES portal upload specification.
   */
  async generateForm24Q(
    companyId: string,
    quarter: number, // 1-4
    fiscalYear: number,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const company = await this.repository.findCompany(companyId);
    if (!company) throw new NotFoundException('Company not found');
    if (company.payrollCountry !== 'IN') throw new BadRequestException('Form 24Q is only for Indian companies');

    // Determine months for the quarter
    const quarterMonths: Record<number, { months: number[]; year: (fy: number) => number[] }> = {
      1: { months: [4, 5, 6], year: (fy) => [fy, fy, fy] },
      2: { months: [7, 8, 9], year: (fy) => [fy, fy, fy] },
      3: { months: [10, 11, 12], year: (fy) => [fy, fy, fy] },
      4: { months: [1, 2, 3], year: (fy) => [fy + 1, fy + 1, fy + 1] },
    };

    const qDef = quarterMonths[quarter];
    if (!qDef) throw new BadRequestException('Invalid quarter (1-4)');

    // Fetch payrolls for all months in the quarter
    const allPayrolls: any[] = [];
    const years = qDef.year(fiscalYear);
    for (let i = 0; i < qDef.months.length; i++) {
      const payrolls = await this.repository.findPayrollsByPeriod(companyId, qDef.months[i], years[i]);
      allPayrolls.push(...payrolls.filter((p: any) => !p.isBonus));
    }

    // Group by employee
    const employeeMap = new Map<string, { name: string; pan: string; totalTds: number; totalGross: number }>();
    for (const p of allPayrolls) {
      const empId = p.employeeId;
      const existing = employeeMap.get(empId) || {
        name: p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : empId,
        pan: '',
        totalTds: 0,
        totalGross: 0,
      };
      existing.totalTds += parseFloat(p.tds?.toString() || '0');
      existing.totalGross += this.safeDecrypt(p.grossSalaryEncrypted);
      employeeMap.set(empId, existing);
    }

    // Fetch PAN for each employee
    for (const [empId, data] of employeeMap) {
      const emp = await this.repository.findEmployee(empId, companyId);
      if (emp) data.pan = this.safeDecryptStr(emp.panEncrypted);
    }

    const lines: string[] = [];
    lines.push('Employee Name,PAN,Gross Salary,TDS Deducted,TDS Deposited');

    let totalGross = 0;
    let totalTds = 0;
    for (const [, data] of employeeMap) {
      lines.push(`"${data.name}","${data.pan}",${data.totalGross.toFixed(2)},${data.totalTds.toFixed(2)},${data.totalTds.toFixed(2)}`);
      totalGross += data.totalGross;
      totalTds += data.totalTds;
    }

    lines.push('');
    lines.push(`"TOTAL","",${totalGross.toFixed(2)},${totalTds.toFixed(2)},${totalTds.toFixed(2)}`);

    const csv = lines.join('\n');
    const fy = `${fiscalYear}-${(fiscalYear + 1).toString().slice(-2)}`;
    const filename = `Form24Q_Q${quarter}_FY${fy}_${company.companyName.replace(/\s+/g, '_')}.csv`;

    return { buffer: Buffer.from(csv, 'utf-8'), filename, contentType: 'text/csv' };
  }

  /**
   * PF ECR — Monthly Electronic Challan cum Return
   * CSV format per EPFO portal specification.
   */
  async generatePFECR(
    companyId: string,
    month: number,
    year: number,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const company = await this.repository.findCompany(companyId);
    if (!company) throw new NotFoundException('Company not found');
    if (company.payrollCountry !== 'IN') throw new BadRequestException('PF ECR is only for Indian companies');

    const payrolls = await this.repository.findPayrollsByPeriod(companyId, month, year);
    const regularPayrolls = payrolls.filter((p: any) => !p.isBonus);

    const lines: string[] = [];
    lines.push('UAN,Employee Name,Gross Wages,EPF Wages,EPS Wages,EDLI Wages,EPF (Employee),EPS (Employer),EPF Diff (Employer),NCP Days,Refund of Advances');

    let totalEpfEmployee = 0;
    let totalEpfEmployer = 0;
    let totalEpsEmployer = 0;

    for (const p of regularPayrolls) {
      const emp = await this.repository.findEmployee(p.employeeId, companyId);
      const uan = emp ? this.safeDecryptStr(emp.uanEncrypted) : '';
      const name = p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : '';
      const grossWages = this.safeDecrypt(p.grossSalaryEncrypted);
      const basicSalary = this.safeDecrypt(p.basicSalaryEncrypted);
      const pfBasic = Math.min(basicSalary, 15000);
      const epfEmployee = parseFloat(p.pfEmployee?.toString() || '0');
      const pfEmployer = parseFloat(p.pfEmployer?.toString() || '0');
      // EPF Employer portion: 3.67% of pfBasic, EPS: 8.33% of pfBasic
      const epsEmployer = Math.round((pfBasic * 8.33) / 100);
      const epfEmployer = pfEmployer - epsEmployer;
      const absentDays = p.absentDays || 0;

      lines.push(
        `"${uan}","${name}",${grossWages.toFixed(2)},${pfBasic.toFixed(2)},${pfBasic.toFixed(2)},${pfBasic.toFixed(2)},${epfEmployee.toFixed(2)},${epsEmployer.toFixed(2)},${epfEmployer.toFixed(2)},${absentDays},0`,
      );

      totalEpfEmployee += epfEmployee;
      totalEpfEmployer += epfEmployer;
      totalEpsEmployer += epsEmployer;
    }

    lines.push('');
    lines.push(`Total EPF Employee: ${totalEpfEmployee.toFixed(2)}`);
    lines.push(`Total EPF Employer: ${totalEpfEmployer.toFixed(2)}`);
    lines.push(`Total EPS Employer: ${totalEpsEmployer.toFixed(2)}`);

    const csv = lines.join('\n');
    const filename = `PF_ECR_${month}_${year}_${company.companyName.replace(/\s+/g, '_')}.csv`;

    return { buffer: Buffer.from(csv, 'utf-8'), filename, contentType: 'text/csv' };
  }

  /**
   * ESI Contribution Sheet — Monthly ESI contribution breakdown
   */
  async generateESIContribution(
    companyId: string,
    month: number,
    year: number,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const company = await this.repository.findCompany(companyId);
    if (!company) throw new NotFoundException('Company not found');
    if (company.payrollCountry !== 'IN') throw new BadRequestException('ESI report is only for Indian companies');

    const payrolls = await this.repository.findPayrollsByPeriod(companyId, month, year);
    const regularPayrolls = payrolls.filter((p: any) => !p.isBonus);

    const lines: string[] = [];
    lines.push('Employee Name,IP Number,Gross Wages,ESI Employee (0.75%),ESI Employer (3.25%),Total ESI');

    let totalEsiEmp = 0;
    let totalEsiEr = 0;

    for (const p of regularPayrolls) {
      const name = p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : '';
      const grossWages = this.safeDecrypt(p.grossSalaryEncrypted);
      const esiEmp = parseFloat(p.esiEmployee?.toString() || '0');
      const esiEr = parseFloat(p.esiEmployer?.toString() || '0');

      if (esiEmp > 0 || esiEr > 0) {
        lines.push(`"${name}","",${grossWages.toFixed(2)},${esiEmp.toFixed(2)},${esiEr.toFixed(2)},${(esiEmp + esiEr).toFixed(2)}`);
        totalEsiEmp += esiEmp;
        totalEsiEr += esiEr;
      }
    }

    lines.push('');
    lines.push(`"TOTAL","","",${totalEsiEmp.toFixed(2)},${totalEsiEr.toFixed(2)},${(totalEsiEmp + totalEsiEr).toFixed(2)}`);

    const csv = lines.join('\n');
    const filename = `ESI_Contribution_${month}_${year}_${company.companyName.replace(/\s+/g, '_')}.csv`;

    return { buffer: Buffer.from(csv, 'utf-8'), filename, contentType: 'text/csv' };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // US REPORTS
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Form 941 — Quarterly Federal Tax Return
   */
  async generateForm941(
    companyId: string,
    quarter: number, // 1-4
    year: number,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const company = await this.repository.findCompany(companyId);
    if (!company) throw new NotFoundException('Company not found');
    if (company.payrollCountry !== 'US') throw new BadRequestException('Form 941 is only for US companies');

    const quarterMonths: Record<number, number[]> = {
      1: [1, 2, 3],
      2: [4, 5, 6],
      3: [7, 8, 9],
      4: [10, 11, 12],
    };

    const months = quarterMonths[quarter];
    if (!months) throw new BadRequestException('Invalid quarter (1-4)');

    const allPayrolls: any[] = [];
    for (const m of months) {
      const payrolls = await this.repository.findPayrollsByPeriod(companyId, m, year);
      allPayrolls.push(...payrolls.filter((p: any) => !p.isBonus));
    }

    // Aggregate
    let totalWages = 0;
    let totalFederalTax = 0;
    let totalSsEmployee = 0;
    let totalSsEmployer = 0;
    let totalMedicareEmployee = 0;
    let totalMedicareEmployer = 0;
    let employeeCount = new Set<string>();

    for (const p of allPayrolls) {
      totalWages += this.safeDecrypt(p.grossSalaryEncrypted);
      totalFederalTax += parseFloat(p.federalTax?.toString() || '0');
      totalSsEmployee += parseFloat(p.ssEmployee?.toString() || '0');
      totalSsEmployer += parseFloat(p.ssEmployer?.toString() || '0');
      totalMedicareEmployee += parseFloat(p.medicareEmployee?.toString() || '0');
      totalMedicareEmployer += parseFloat(p.medicareEmployer?.toString() || '0');
      employeeCount.add(p.employeeId);
    }

    const lines: string[] = [];
    lines.push('Form 941 — Employer\'s QUARTERLY Federal Tax Return');
    lines.push(`Quarter: Q${quarter} ${year}`);
    lines.push(`Employer: ${company.companyName}`);
    lines.push(`EIN: ${this.safeDecryptStr(company.einEncrypted)}`);
    lines.push('');
    lines.push('Line,Description,Amount');
    lines.push(`1,Number of employees who received wages,${employeeCount.size}`);
    lines.push(`2,Wages tips and other compensation,${totalWages.toFixed(2)}`);
    lines.push(`3,Federal income tax withheld,${totalFederalTax.toFixed(2)}`);
    lines.push(`5a,Taxable social security wages,${totalWages.toFixed(2)}`);
    lines.push(`5a(ii),SS tax (employee + employer),${(totalSsEmployee + totalSsEmployer).toFixed(2)}`);
    lines.push(`5c,Taxable Medicare wages,${totalWages.toFixed(2)}`);
    lines.push(`5c(ii),Medicare tax (employee + employer),${(totalMedicareEmployee + totalMedicareEmployer).toFixed(2)}`);
    lines.push(`6,Total taxes before adjustments,${(totalFederalTax + totalSsEmployee + totalSsEmployer + totalMedicareEmployee + totalMedicareEmployer).toFixed(2)}`);
    lines.push(`10,Total taxes after adjustments,${(totalFederalTax + totalSsEmployee + totalSsEmployer + totalMedicareEmployee + totalMedicareEmployer).toFixed(2)}`);

    const csv = lines.join('\n');
    const filename = `Form941_Q${quarter}_${year}_${company.companyName.replace(/\s+/g, '_')}.csv`;

    return { buffer: Buffer.from(csv, 'utf-8'), filename, contentType: 'text/csv' };
  }

  /**
   * State Tax Report — Quarterly state withholding
   */
  async generateStateTaxReport(
    companyId: string,
    quarter: number,
    year: number,
    state: string,
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    const company = await this.repository.findCompany(companyId);
    if (!company) throw new NotFoundException('Company not found');
    if (company.payrollCountry !== 'US') throw new BadRequestException('State tax report is only for US companies');

    const quarterMonths: Record<number, number[]> = {
      1: [1, 2, 3],
      2: [4, 5, 6],
      3: [7, 8, 9],
      4: [10, 11, 12],
    };

    const months = quarterMonths[quarter];
    if (!months) throw new BadRequestException('Invalid quarter (1-4)');

    const allPayrolls: any[] = [];
    for (const m of months) {
      const payrolls = await this.repository.findPayrollsByPeriod(companyId, m, year);
      // Filter by employee's state
      for (const p of payrolls) {
        if (!p.isBonus && p.employee?.state === state) {
          allPayrolls.push(p);
        }
      }
    }

    const lines: string[] = [];
    lines.push(`State Tax Withholding Report — ${state}`);
    lines.push(`Quarter: Q${quarter} ${year}`);
    lines.push(`Employer: ${company.companyName}`);
    lines.push('');
    lines.push('Employee Name,SSN (last 4),State Wages,State Tax Withheld');

    let totalWages = 0;
    let totalStateTax = 0;

    for (const p of allPayrolls) {
      const name = p.employee ? `${p.employee.firstName} ${p.employee.lastName}` : '';
      const emp = await this.repository.findEmployee(p.employeeId, companyId);
      const ssnLast4 = emp ? this.safeDecryptStr(emp.ssnEncrypted).slice(-4) : '';
      const wages = this.safeDecrypt(p.grossSalaryEncrypted);
      const stateTax = parseFloat(p.stateTax?.toString() || '0');

      lines.push(`"${name}","***-**-${ssnLast4}",${wages.toFixed(2)},${stateTax.toFixed(2)}`);
      totalWages += wages;
      totalStateTax += stateTax;
    }

    lines.push('');
    lines.push(`"TOTAL","",${totalWages.toFixed(2)},${totalStateTax.toFixed(2)}`);

    const csv = lines.join('\n');
    const filename = `StateTax_${state}_Q${quarter}_${year}_${company.companyName.replace(/\s+/g, '_')}.csv`;

    return { buffer: Buffer.from(csv, 'utf-8'), filename, contentType: 'text/csv' };
  }
}
