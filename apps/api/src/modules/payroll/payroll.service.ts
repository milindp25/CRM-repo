import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';
import { PayrollRepository } from './payroll.repository';
import { TaxEngineFactory } from './tax-engines/tax-engine.factory';
import type { TaxComputationInput, TaxComputationResult } from './tax-engines/tax-engine.interface';
import {
  CreatePayrollDto,
  UpdatePayrollDto,
  PayrollResponseDto,
  PayrollPaginationResponseDto,
  ProcessPayrollDto,
  MarkPaidDto,
  ProcessBonusDto,
  BatchStatusResponseDto,
  ReconciliationResponseDto,
  MyPayslipResponseDto,
  MyPayslipHistoryResponseDto,
} from './dto';

@Injectable()
export class PayrollService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly encryptionKey: string;
  private readonly serviceLogger = new Logger(PayrollService.name);

  constructor(
    private readonly repository: PayrollRepository,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly cache: CacheService,
    private readonly taxEngineFactory: TaxEngineFactory,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key) {
      throw new Error('ENCRYPTION_KEY is not configured');
    }
    // Use first 32 bytes of the key for AES-256
    this.encryptionKey = key.substring(0, 64);
  }

  // ─── Encryption helpers ─────────────────────────────────────────────────────

  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const key = Buffer.from(this.encryptionKey, 'hex');
    const cipher = createCipheriv(this.algorithm, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
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
    try {
      return parseFloat(this.decrypt(val));
    } catch {
      return 0;
    }
  }

  // ─── Pay frequency helpers ──────────────────────────────────────────────────

  private getPeriodsPerYear(payFrequency: string): number {
    switch (payFrequency) {
      case 'WEEKLY': return 52;
      case 'BI_WEEKLY': return 26;
      case 'SEMI_MONTHLY': return 24;
      case 'MONTHLY':
      default: return 12;
    }
  }

  private getFiscalYear(country: string, month: number, year: number): number {
    if (country === 'IN') {
      // India FY: April-March. FY 2025-26 starts April 2025
      return month >= 4 ? year : year - 1;
    }
    // US: Calendar year
    return year;
  }

  private getMonthsRemainingInFY(country: string, month: number, year: number): number {
    if (country === 'IN') {
      // India FY: April (month 4) to March (month 3)
      if (month >= 4) return 12 - (month - 4); // April=12, May=11, ..., March=1
      return 3 - month + 1; // Jan=3, Feb=2, Mar=1
    }
    // US: Calendar year
    return 12 - month + 1;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // MANUAL CRUD (backward-compatible with existing manual payroll entry)
  // ═══════════════════════════════════════════════════════════════════════════════

  async create(
    companyId: string,
    userId: string,
    dto: CreatePayrollDto,
  ): Promise<PayrollResponseDto> {
    this.logger.log(`Creating payroll for employee ${dto.employeeId}`);

    // Calculate salary
    const basicSalary = dto.basicSalary;
    const hra = dto.hra || 0;
    const specialAllowance = dto.specialAllowance || 0;
    const otherAllowances = dto.otherAllowances || 0;
    const grossSalary = basicSalary + hra + specialAllowance + otherAllowances;

    const pfEmployee = dto.pfEmployee || 0;
    const esiEmployee = dto.esiEmployee || 0;
    const tds = dto.tds || 0;
    const pt = dto.pt || 0;
    const otherDeductions = dto.otherDeductions || 0;
    const totalDeductions = pfEmployee + esiEmployee + tds + pt + otherDeductions;

    const netSalary = grossSalary - totalDeductions;

    const createData: Prisma.PayrollCreateInput = {
      payPeriodMonth: dto.payPeriodMonth,
      payPeriodYear: dto.payPeriodYear,
      ...(dto.payDate && { payDate: new Date(dto.payDate) }),
      basicSalaryEncrypted: this.encrypt(basicSalary.toString()),
      ...(hra > 0 && { hraEncrypted: this.encrypt(hra.toString()) }),
      ...(specialAllowance > 0 && { specialAllowanceEncrypted: this.encrypt(specialAllowance.toString()) }),
      ...(otherAllowances > 0 && { otherAllowancesEncrypted: this.encrypt(otherAllowances.toString()) }),
      grossSalaryEncrypted: this.encrypt(grossSalary.toString()),
      netSalaryEncrypted: this.encrypt(netSalary.toString()),
      pfEmployee: dto.pfEmployee || 0,
      pfEmployer: dto.pfEmployer || 0,
      esiEmployee: dto.esiEmployee || 0,
      esiEmployer: dto.esiEmployer || 0,
      tds: dto.tds || 0,
      pt: dto.pt || 0,
      otherDeductions: dto.otherDeductions || 0,
      daysWorked: dto.daysWorked,
      daysInMonth: dto.daysInMonth,
      leaveDays: dto.leaveDays || 0,
      absentDays: dto.absentDays || 0,
      overtimeHours: dto.overtimeHours || 0,
      ...(dto.bankAccount && { bankAccountEncrypted: this.encrypt(dto.bankAccount) }),
      ...(dto.ifscCode && { ifscCodeEncrypted: this.encrypt(dto.ifscCode) }),
      ...(dto.bankName && { bankName: dto.bankName }),
      ...(dto.notes && { notes: dto.notes }),
      status: 'DRAFT',
      country: 'IN',
      company: { connect: { id: companyId } },
      employee: { connect: { id: dto.employeeId } },
    };

    const payroll = await this.repository.create(createData);

    this.cache.invalidateByPrefix('payroll:');

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'PAYROLL',
      resourceId: payroll.id,
      newValues: { employeeId: dto.employeeId, period: `${dto.payPeriodMonth}/${dto.payPeriodYear}` },
    });

    return this.formatPayroll(payroll);
  }

  async findAll(
    companyId: string,
    filter: any,
  ): Promise<PayrollPaginationResponseDto> {
    this.logger.log('Finding all payroll records');

    const cacheKey = `payroll:${companyId}:${JSON.stringify(filter)}`;

    return this.cache.getOrSet(cacheKey, async () => {
      const where: any = { companyId };

      if (filter.employeeId) where.employeeId = filter.employeeId;
      if (filter.status) where.status = filter.status;
      if (filter.month) where.payPeriodMonth = filter.month;
      if (filter.year) where.payPeriodYear = filter.year;
      if (filter.startDate || filter.endDate) {
        where.payDate = {};
        if (filter.startDate) where.payDate.gte = filter.startDate;
        if (filter.endDate) where.payDate.lte = filter.endDate;
      }

      const data = await this.repository.findMany({
        skip: filter.skip,
        take: filter.take,
        where,
        orderBy: { createdAt: 'desc' },
      });

      return {
        data: data.map((p: any) => this.formatPayroll(p)),
        meta: {
          currentPage: 1,
          itemsPerPage: filter.take || 20,
          totalItems: data.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }, 30_000);
  }

  async findOne(id: string, companyId: string): Promise<PayrollResponseDto> {
    this.logger.log(`Finding payroll ${id}`);

    const payroll = await this.repository.findById(id);
    if (!payroll || payroll.companyId !== companyId) {
      throw new NotFoundException(`Payroll record not found`);
    }

    return this.formatPayroll(payroll);
  }

  async update(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdatePayrollDto,
  ): Promise<PayrollResponseDto> {
    this.logger.log(`Updating payroll ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing || existing.companyId !== companyId) {
      throw new NotFoundException(`Payroll record not found`);
    }

    if (existing.status === 'PAID') {
      throw new ConflictException('Cannot update paid payroll');
    }

    const updateData: Prisma.PayrollUpdateInput = {};

    if (dto.daysWorked !== undefined) updateData.daysWorked = dto.daysWorked;
    if (dto.daysInMonth !== undefined) updateData.daysInMonth = dto.daysInMonth;
    if (dto.leaveDays !== undefined) updateData.leaveDays = dto.leaveDays;
    if (dto.absentDays !== undefined) updateData.absentDays = dto.absentDays;
    if (dto.overtimeHours !== undefined) updateData.overtimeHours = dto.overtimeHours;
    if (dto.pfEmployee !== undefined) updateData.pfEmployee = dto.pfEmployee;
    if (dto.pfEmployer !== undefined) updateData.pfEmployer = dto.pfEmployer;
    if (dto.esiEmployee !== undefined) updateData.esiEmployee = dto.esiEmployee;
    if (dto.esiEmployer !== undefined) updateData.esiEmployer = dto.esiEmployer;
    if (dto.tds !== undefined) updateData.tds = dto.tds;
    if (dto.pt !== undefined) updateData.pt = dto.pt;
    if (dto.otherDeductions !== undefined) updateData.otherDeductions = dto.otherDeductions;

    if (dto.bankAccount !== undefined) {
      updateData.bankAccountEncrypted = dto.bankAccount ? this.encrypt(dto.bankAccount) : null;
    }
    if (dto.ifscCode !== undefined) {
      updateData.ifscCodeEncrypted = dto.ifscCode ? this.encrypt(dto.ifscCode) : null;
    }
    if (dto.bankName !== undefined) updateData.bankName = dto.bankName;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.payDate) updateData.payDate = new Date(dto.payDate);

    const updated = await this.repository.update(id, updateData);
    this.cache.invalidateByPrefix('payroll:');

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'PAYROLL',
      resourceId: id,
      newValues: dto,
    });

    return this.formatPayroll(updated);
  }

  async remove(id: string, companyId: string, userId: string): Promise<void> {
    this.logger.log(`Deleting payroll ${id}`);

    const payroll = await this.repository.findById(id);
    if (!payroll || payroll.companyId !== companyId) {
      throw new NotFoundException(`Payroll record not found`);
    }
    if (payroll.status === 'PAID') {
      throw new ConflictException('Cannot delete paid payroll');
    }

    await this.repository.delete(id);
    this.cache.invalidateByPrefix('payroll:');

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'PAYROLL',
      resourceId: id,
      oldValues: { employeeId: payroll.employeeId },
    });
  }

  async processPayroll(id: string, companyId: string, userId: string, dto: ProcessPayrollDto): Promise<PayrollResponseDto> {
    const payroll = await this.repository.findById(id);
    if (!payroll || payroll.companyId !== companyId) {
      throw new NotFoundException(`Payroll record not found`);
    }
    if (payroll.status !== 'DRAFT') {
      throw new ConflictException('Only draft payroll can be processed');
    }

    const updated = await this.repository.update(id, {
      status: 'PROCESSED',
      ...(dto.notes && { notes: dto.notes }),
    });
    this.cache.invalidateByPrefix('payroll:');

    await this.repository.createAuditLog({
      userId, companyId,
      action: 'UPDATE',
      resourceType: 'PAYROLL',
      resourceId: id,
      newValues: { status: 'PROCESSED' },
    });

    this.eventEmitter.emit('payroll.processed', {
      companyId,
      employeeId: payroll.employeeId,
      payrollId: id,
      month: payroll.payPeriodMonth,
      year: payroll.payPeriodYear,
    });

    return this.formatPayroll(updated);
  }

  async markAsPaid(id: string, companyId: string, userId: string, dto: MarkPaidDto): Promise<PayrollResponseDto> {
    const payroll = await this.repository.findById(id);
    if (!payroll || payroll.companyId !== companyId) {
      throw new NotFoundException(`Payroll record not found`);
    }
    if (payroll.status === 'PAID') {
      throw new ConflictException('Payroll is already marked as paid');
    }

    // If approval workflow is configured and status is PENDING_APPROVAL, block
    if (payroll.approvalStatus === 'PENDING_APPROVAL') {
      throw new ConflictException('Payroll is pending approval. Cannot mark as paid until approved.');
    }
    if (payroll.approvalStatus === 'REJECTED') {
      throw new ConflictException('Payroll was rejected. Please revise and resubmit for approval.');
    }

    const updated = await this.repository.update(id, {
      status: 'PAID',
      paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
      ...(dto.notes && { notes: dto.notes }),
    });
    this.cache.invalidateByPrefix('payroll:');

    // Update YTD when marking as paid
    try {
      const company = await this.repository.findCompany(companyId);
      const country = payroll.country || company?.payrollCountry || 'IN';
      const fiscalYear = this.getFiscalYear(country, payroll.payPeriodMonth, payroll.payPeriodYear);
      const grossMonthly = this.safeDecrypt(payroll.grossSalaryEncrypted);

      const taxResult: TaxComputationResult = {
        grossSalary: grossMonthly,
        netSalary: this.safeDecrypt(payroll.netSalaryEncrypted),
        totalDeductions: 0,
        totalEmployerContributions: 0,
        pfEmployee: parseFloat(payroll.pfEmployee?.toString() || '0'),
        pfEmployer: parseFloat(payroll.pfEmployer?.toString() || '0'),
        esiEmployee: parseFloat(payroll.esiEmployee?.toString() || '0'),
        esiEmployer: parseFloat(payroll.esiEmployer?.toString() || '0'),
        tds: parseFloat(payroll.tds?.toString() || '0'),
        pt: parseFloat(payroll.pt?.toString() || '0'),
        ssEmployee: parseFloat(payroll.ssEmployee?.toString() || '0'),
        ssEmployer: parseFloat(payroll.ssEmployer?.toString() || '0'),
        medicareEmployee: parseFloat(payroll.medicareEmployee?.toString() || '0'),
        medicareEmployer: parseFloat(payroll.medicareEmployer?.toString() || '0'),
        federalWithholding: parseFloat(payroll.federalTax?.toString() || '0'),
        stateWithholding: parseFloat(payroll.stateTax?.toString() || '0'),
        computationBreakdown: {},
      };

      await this.updateYtd(companyId, payroll.employeeId, fiscalYear, taxResult, grossMonthly);
    } catch (err: any) {
      this.serviceLogger.warn(`Failed to update YTD after marking paid: ${err.message}`);
    }

    await this.repository.createAuditLog({
      userId, companyId,
      action: 'UPDATE',
      resourceType: 'PAYROLL',
      resourceId: id,
      newValues: { status: 'PAID', paidAt: updated.paidAt },
    });

    this.eventEmitter.emit('payroll.paid', {
      companyId,
      employeeId: payroll.employeeId,
      payrollId: id,
      month: payroll.payPeriodMonth,
      year: payroll.payPeriodYear,
    });

    return this.formatPayroll(updated);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // AUTO-COMPUTED PAYROLL (from salary structure + tax engine)
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Create payroll from salary structure with auto-computed taxes.
   * Uses the company's tax engine (IN/US) and the employee's salary structure.
   */
  async createFromStructure(
    companyId: string,
    employeeId: string,
    month: number,
    year: number,
    userId: string,
  ): Promise<PayrollResponseDto> {
    const company = await this.repository.findCompany(companyId);
    if (!company) throw new NotFoundException('Company not found');

    const employee = await this.repository.findEmployee(employeeId, companyId);
    if (!employee) throw new NotFoundException('Employee not found');

    if (!employee.salaryStructureId) {
      throw new BadRequestException(`Employee ${employee.firstName} ${employee.lastName} has no salary structure assigned`);
    }

    if (!employee.annualCtc || parseFloat(employee.annualCtc.toString()) <= 0) {
      throw new BadRequestException(`Employee ${employee.firstName} ${employee.lastName} has no annual CTC set`);
    }

    const structure = await this.repository.findSalaryStructure(employee.salaryStructureId);
    if (!structure || !structure.isActive) {
      throw new BadRequestException('Assigned salary structure is not active');
    }

    const country = company.payrollCountry || 'IN';
    const payFrequency = company.payFrequency || 'MONTHLY';
    const periodsPerYear = this.getPeriodsPerYear(payFrequency);
    const annualCtc = parseFloat(employee.annualCtc.toString());

    // Calculate gross salary from structure components
    const components = structure.components as any[];
    const { grossMonthly, basicMonthly, earningsBreakdown } = this.computeSalaryFromStructure(
      components,
      annualCtc,
      periodsPerYear,
    );

    // Pro-rate for attendance (LOP deduction)
    const daysInMonth = new Date(year, month, 0).getDate();
    const daysWorked = daysInMonth; // Full attendance by default
    const proRatedGross = (grossMonthly / daysInMonth) * daysWorked;
    const proRatedBasic = (basicMonthly / daysInMonth) * daysWorked;

    // Fetch YTD data
    const fiscalYear = this.getFiscalYear(country, month, year);
    const ytd = await this.repository.findYtd(companyId, employeeId, fiscalYear);

    // Build tax computation input
    const taxInput: TaxComputationInput = {
      grossMonthly: proRatedGross,
      basicMonthly: proRatedBasic,
      annualCTC: grossMonthly * periodsPerYear,
      state: employee.state || '',
      fiscalYear,
      payPeriodMonth: month,
      monthsRemaining: this.getMonthsRemainingInFY(country, month, year),
      ytdGrossEarnings: ytd ? this.safeDecrypt(ytd.grossEarningsEncrypted) : 0,
      ytdTaxPaid: ytd ? this.safeDecrypt(ytd.taxPaidEncrypted) : 0,
      ytdSsWages: ytd ? parseFloat(ytd.ssEmployeeYtd?.toString() || '0') / 0.062 : 0,
      taxRegime: (employee.taxRegime as 'NEW' | 'OLD') || 'NEW',
      pfEnabled: company.pfEnabled,
      esiEnabled: company.esiEnabled,
      filingStatus: employee.filingStatus || 'SINGLE',
      w4Allowances: employee.w4Allowances || 0,
      isBonus: false,
    };

    // Run tax engine
    const engine = await this.taxEngineFactory.getEngine(country as 'IN' | 'US');
    const taxResult = engine.compute(taxInput);

    // Create payroll record
    const createData: Prisma.PayrollCreateInput = {
      payPeriodMonth: month,
      payPeriodYear: year,
      country,
      payFrequency,
      salaryStructureId: structure.id,
      taxRegimeUsed: country === 'IN' ? (employee.taxRegime || 'NEW') : undefined,
      basicSalaryEncrypted: this.encrypt(proRatedBasic.toString()),
      grossSalaryEncrypted: this.encrypt(taxResult.grossSalary.toString()),
      netSalaryEncrypted: this.encrypt(taxResult.netSalary.toString()),
      earningsBreakdown: earningsBreakdown as any,
      computationBreakdown: taxResult.computationBreakdown as any,
      pfEmployee: taxResult.pfEmployee,
      pfEmployer: taxResult.pfEmployer,
      esiEmployee: taxResult.esiEmployee,
      esiEmployer: taxResult.esiEmployer,
      tds: taxResult.tds,
      pt: taxResult.pt,
      ssEmployee: taxResult.ssEmployee,
      ssEmployer: taxResult.ssEmployer,
      medicareEmployee: taxResult.medicareEmployee,
      medicareEmployer: taxResult.medicareEmployer,
      federalTax: taxResult.federalWithholding,
      stateTax: taxResult.stateWithholding,
      otherDeductions: 0,
      daysWorked,
      daysInMonth,
      leaveDays: 0,
      absentDays: 0,
      overtimeHours: 0,
      status: 'DRAFT',
      company: { connect: { id: companyId } },
      employee: { connect: { id: employeeId } },
    };

    const payroll = await this.repository.create(createData);
    this.cache.invalidateByPrefix('payroll:');

    await this.repository.createAuditLog({
      userId, companyId,
      action: 'CREATE',
      resourceType: 'PAYROLL',
      resourceId: payroll.id,
      newValues: {
        employeeId,
        period: `${month}/${year}`,
        autoComputed: true,
        taxEngine: country,
      },
    });

    return this.formatPayroll(payroll);
  }

  /**
   * Compute salary components from a salary structure definition.
   */
  private computeSalaryFromStructure(
    components: any[],
    annualCtc: number,
    periodsPerYear: number,
  ): { grossMonthly: number; basicMonthly: number; earningsBreakdown: Record<string, number> } {
    const earningsBreakdown: Record<string, number> = {};
    const monthlyGross = Math.round(annualCtc / periodsPerYear);
    let basicMonthly = 0;
    let grossMonthly = 0;

    // First pass: PERCENTAGE_OF_GROSS — computed from CTC monthly gross
    for (const comp of components) {
      if (comp.type === 'EARNING' && comp.calculationType === 'PERCENTAGE_OF_GROSS') {
        const monthly = Math.round((monthlyGross * comp.value) / 100);
        earningsBreakdown[comp.name] = monthly;
        if (comp.name.toLowerCase().includes('basic')) {
          basicMonthly = monthly;
        }
        grossMonthly += monthly;
      }
    }

    // Second pass: FIXED earnings
    for (const comp of components) {
      if (comp.type === 'EARNING' && comp.calculationType === 'FIXED') {
        const monthly = comp.value;
        earningsBreakdown[comp.name] = monthly;
        if (comp.name.toLowerCase().includes('basic')) {
          basicMonthly = monthly;
        }
        grossMonthly += monthly;
      }
    }

    // Third pass: percentage-based on basic
    for (const comp of components) {
      if (comp.type === 'EARNING' && comp.calculationType === 'PERCENTAGE_OF_BASIC') {
        const monthly = Math.round((basicMonthly * comp.value) / 100);
        earningsBreakdown[comp.name] = monthly;
        grossMonthly += monthly;
      }
    }

    // Handle deductions from the structure (non-statutory deductions)
    for (const comp of components) {
      if (comp.type === 'DEDUCTION') {
        let amount = 0;
        if (comp.calculationType === 'FIXED') {
          amount = comp.value;
        } else if (comp.calculationType === 'PERCENTAGE_OF_BASIC') {
          amount = Math.round((basicMonthly * comp.value) / 100);
        } else if (comp.calculationType === 'PERCENTAGE_OF_GROSS') {
          amount = Math.round((monthlyGross * comp.value) / 100);
        }
        earningsBreakdown[`deduction:${comp.name}`] = amount;
      }
    }

    return { grossMonthly, basicMonthly, earningsBreakdown };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BATCH PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Batch process payroll for all active employees with salary structures.
   */
  async batchProcess(
    companyId: string,
    month: number,
    year: number,
    userId: string,
  ): Promise<BatchStatusResponseDto> {
    this.logger.log(`Starting batch payroll for company ${companyId}, ${month}/${year}`);

    // Check for existing batch (unique constraint)
    const existingBatch = await this.repository.findBatch(companyId, month, year);
    if (existingBatch) {
      throw new ConflictException(`Payroll batch already exists for ${month}/${year}. Status: ${existingBatch.status}`);
    }

    // Fetch all active employees with salary structures
    const employees = await this.repository.findActiveEmployeesWithStructures(companyId);
    if (employees.length === 0) {
      throw new BadRequestException('No active employees with salary structures found');
    }

    // Create batch record
    const batch = await this.repository.createBatch({
      company: { connect: { id: companyId } },
      month,
      year,
      status: 'PROCESSING',
      totalCount: employees.length,
      processedCount: 0,
      failedCount: 0,
      errors: [],
      initiatedBy: userId,
    });

    // Process each employee
    const errors: Array<{ employeeId: string; error: string }> = [];
    let processedCount = 0;

    for (const emp of employees) {
      try {
        await this.createFromStructure(companyId, emp.id, month, year, userId);
        processedCount++;
      } catch (error: any) {
        errors.push({ employeeId: emp.id, error: error.message || 'Unknown error' });
        this.serviceLogger.warn(`Failed to process payroll for employee ${emp.id}: ${error.message}`);
      }
    }

    // Determine final status
    const failedCount = errors.length;
    let status = 'COMPLETED';
    if (failedCount === employees.length) {
      status = 'FAILED';
    } else if (failedCount > 0) {
      status = 'PARTIAL';
    }

    const updatedBatch = await this.repository.updateBatch(batch.id, {
      status,
      processedCount,
      failedCount,
      errors: errors as any,
      completedAt: new Date(),
    });

    this.cache.invalidateByPrefix('payroll:');

    await this.repository.createAuditLog({
      userId, companyId,
      action: 'CREATE',
      resourceType: 'PAYROLL_BATCH',
      resourceId: batch.id,
      newValues: { month, year, totalCount: employees.length, processedCount, failedCount, status },
    });

    this.eventEmitter.emit('payroll.batch.completed', {
      companyId,
      batchId: batch.id,
      month, year, status,
      processedCount,
      failedCount,
    });

    return this.formatBatch(updatedBatch);
  }

  async getBatch(batchId: string, companyId: string): Promise<BatchStatusResponseDto> {
    const batch = await this.repository.findBatchById(batchId);
    if (!batch || batch.companyId !== companyId) {
      throw new NotFoundException('Payroll batch not found');
    }
    return this.formatBatch(batch);
  }

  async listBatches(companyId: string): Promise<BatchStatusResponseDto[]> {
    const batches = await this.repository.findBatches(companyId);
    return batches.map((b: any) => this.formatBatch(b));
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BONUS PROCESSING
  // ═══════════════════════════════════════════════════════════════════════════════

  /**
   * Process one-time bonus for employee(s).
   * TDS/federal withholding applies, but PF/ESI/FICA does NOT.
   */
  async processBonus(
    companyId: string,
    dto: ProcessBonusDto,
    userId: string,
  ): Promise<PayrollResponseDto[]> {
    const company = await this.repository.findCompany(companyId);
    if (!company) throw new NotFoundException('Company not found');

    const country = company.payrollCountry || 'IN';
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const results: PayrollResponseDto[] = [];

    for (const employeeId of dto.employeeIds) {
      const employee = await this.repository.findEmployee(employeeId, companyId);
      if (!employee) {
        this.serviceLogger.warn(`Bonus: Employee ${employeeId} not found, skipping`);
        continue;
      }

      // Compute bonus amount
      let bonusAmount = dto.amount;
      if (dto.bonusType === 'PERCENTAGE_OF_BASIC' || dto.bonusType === 'PERCENTAGE_OF_CTC') {
        if (!employee.salaryStructureId) {
          this.serviceLogger.warn(`Bonus: Employee ${employeeId} has no salary structure, skipping`);
          continue;
        }
        const structure = await this.repository.findSalaryStructure(employee.salaryStructureId);
        if (!structure) continue;

        const components = structure.components as any[];
        const payFrequency = company.payFrequency || 'MONTHLY';
        const periodsPerYear = this.getPeriodsPerYear(payFrequency);
        const annualCtc = employee.annualCtc ? parseFloat(employee.annualCtc.toString()) : 0;
        if (annualCtc <= 0) {
          this.serviceLogger.warn(`Bonus: Employee ${employeeId} has no annual CTC, skipping`);
          continue;
        }
        const { grossMonthly, basicMonthly } = this.computeSalaryFromStructure(components, annualCtc, periodsPerYear);

        if (dto.bonusType === 'PERCENTAGE_OF_BASIC') {
          bonusAmount = Math.round((basicMonthly * dto.amount) / 100);
        } else {
          bonusAmount = Math.round((grossMonthly * dto.amount) / 100);
        }
      }

      // Fetch YTD
      const fiscalYear = this.getFiscalYear(country, month, year);
      const ytd = await this.repository.findYtd(companyId, employeeId, fiscalYear);

      const taxInput: TaxComputationInput = {
        grossMonthly: bonusAmount,
        basicMonthly: 0,
        annualCTC: bonusAmount,
        state: employee.state || '',
        fiscalYear,
        payPeriodMonth: month,
        monthsRemaining: this.getMonthsRemainingInFY(country, month, year),
        ytdGrossEarnings: ytd ? this.safeDecrypt(ytd.grossEarningsEncrypted) : 0,
        ytdTaxPaid: ytd ? this.safeDecrypt(ytd.taxPaidEncrypted) : 0,
        ytdSsWages: 0,
        taxRegime: (employee.taxRegime as 'NEW' | 'OLD') || 'NEW',
        pfEnabled: false,
        esiEnabled: false,
        filingStatus: employee.filingStatus || 'SINGLE',
        w4Allowances: employee.w4Allowances || 0,
        isBonus: true,
      };

      const engine = await this.taxEngineFactory.getEngine(country as 'IN' | 'US');
      const taxResult = engine.compute(taxInput);

      const createData: Prisma.PayrollCreateInput = {
        payPeriodMonth: month,
        payPeriodYear: year,
        country,
        payFrequency: company.payFrequency || 'MONTHLY',
        isBonus: true,
        bonusAmount,
        basicSalaryEncrypted: this.encrypt('0'),
        grossSalaryEncrypted: this.encrypt(bonusAmount.toString()),
        netSalaryEncrypted: this.encrypt(taxResult.netSalary.toString()),
        earningsBreakdown: { 'Bonus': bonusAmount } as any,
        computationBreakdown: taxResult.computationBreakdown as any,
        pfEmployee: 0, pfEmployer: 0,
        esiEmployee: 0, esiEmployer: 0,
        tds: taxResult.tds,
        pt: 0,
        ssEmployee: 0, ssEmployer: 0,
        medicareEmployee: 0, medicareEmployer: 0,
        federalTax: taxResult.federalWithholding,
        stateTax: taxResult.stateWithholding,
        otherDeductions: 0,
        daysWorked: 0, daysInMonth: 0,
        leaveDays: 0, absentDays: 0, overtimeHours: 0,
        status: 'PROCESSED',
        notes: dto.notes || `Bonus payout: ${dto.bonusType}`,
        company: { connect: { id: companyId } },
        employee: { connect: { id: employeeId } },
      };

      const payroll = await this.repository.create(createData);
      results.push(this.formatPayroll(payroll));

      this.eventEmitter.emit('payroll.bonus', {
        companyId, employeeId,
        payrollId: payroll.id,
        bonusAmount,
        currency: country === 'IN' ? 'INR' : 'USD',
      });
    }

    this.cache.invalidateByPrefix('payroll:');
    return results;
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RECALCULATION
  // ═══════════════════════════════════════════════════════════════════════════════

  async recalculate(id: string, companyId: string, userId: string): Promise<PayrollResponseDto> {
    const payroll = await this.repository.findById(id);
    if (!payroll || payroll.companyId !== companyId) {
      throw new NotFoundException('Payroll record not found');
    }
    if (payroll.status === 'PAID') {
      throw new ConflictException('Cannot recalculate paid payroll');
    }

    const company = await this.repository.findCompany(companyId);
    if (!company) throw new NotFoundException('Company not found');

    const employee = await this.repository.findEmployee(payroll.employeeId, companyId);
    if (!employee) throw new NotFoundException('Employee not found');

    const country = payroll.country || company.payrollCountry || 'IN';
    const grossMonthly = this.safeDecrypt(payroll.grossSalaryEncrypted);
    const basicMonthly = this.safeDecrypt(payroll.basicSalaryEncrypted);

    const fiscalYear = this.getFiscalYear(country, payroll.payPeriodMonth, payroll.payPeriodYear);
    const ytd = await this.repository.findYtd(companyId, payroll.employeeId, fiscalYear);

    const taxInput: TaxComputationInput = {
      grossMonthly,
      basicMonthly,
      annualCTC: grossMonthly * this.getPeriodsPerYear(payroll.payFrequency || 'MONTHLY'),
      state: employee.state || '',
      fiscalYear,
      payPeriodMonth: payroll.payPeriodMonth,
      monthsRemaining: this.getMonthsRemainingInFY(country, payroll.payPeriodMonth, payroll.payPeriodYear),
      ytdGrossEarnings: ytd ? this.safeDecrypt(ytd.grossEarningsEncrypted) : 0,
      ytdTaxPaid: ytd ? this.safeDecrypt(ytd.taxPaidEncrypted) : 0,
      ytdSsWages: ytd ? parseFloat(ytd.ssEmployeeYtd?.toString() || '0') / 0.062 : 0,
      taxRegime: (employee.taxRegime as 'NEW' | 'OLD') || 'NEW',
      pfEnabled: company.pfEnabled,
      esiEnabled: company.esiEnabled,
      filingStatus: employee.filingStatus || 'SINGLE',
      w4Allowances: employee.w4Allowances || 0,
      isBonus: payroll.isBonus,
    };

    const engine = await this.taxEngineFactory.getEngine(country as 'IN' | 'US');
    const taxResult = engine.compute(taxInput);

    const updated = await this.repository.update(id, {
      netSalaryEncrypted: this.encrypt(taxResult.netSalary.toString()),
      computationBreakdown: taxResult.computationBreakdown as any,
      pfEmployee: taxResult.pfEmployee,
      pfEmployer: taxResult.pfEmployer,
      esiEmployee: taxResult.esiEmployee,
      esiEmployer: taxResult.esiEmployer,
      tds: taxResult.tds,
      pt: taxResult.pt,
      ssEmployee: taxResult.ssEmployee,
      ssEmployer: taxResult.ssEmployer,
      medicareEmployee: taxResult.medicareEmployee,
      medicareEmployer: taxResult.medicareEmployer,
      federalTax: taxResult.federalWithholding,
      stateTax: taxResult.stateWithholding,
      taxRegimeUsed: country === 'IN' ? (employee.taxRegime || 'NEW') : undefined,
    });

    this.cache.invalidateByPrefix('payroll:');

    await this.repository.createAuditLog({
      userId, companyId,
      action: 'UPDATE',
      resourceType: 'PAYROLL',
      resourceId: id,
      newValues: { action: 'recalculate', taxEngine: country },
    });

    return this.formatPayroll(updated);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // YTD TRACKING
  // ═══════════════════════════════════════════════════════════════════════════════

  async updateYtd(
    companyId: string,
    employeeId: string,
    fiscalYear: number,
    taxResult: TaxComputationResult,
    grossMonthly: number,
  ): Promise<void> {
    const existing = await this.repository.findYtd(companyId, employeeId, fiscalYear);

    if (existing) {
      const currentGross = this.safeDecrypt(existing.grossEarningsEncrypted);
      const currentDeductions = this.safeDecrypt(existing.totalDeductionsEncrypted);
      const currentTaxPaid = this.safeDecrypt(existing.taxPaidEncrypted);

      await this.repository.updateYtd(existing.id, {
        grossEarningsEncrypted: this.encrypt((currentGross + grossMonthly).toString()),
        totalDeductionsEncrypted: this.encrypt((currentDeductions + taxResult.totalDeductions).toString()),
        taxPaidEncrypted: this.encrypt((currentTaxPaid + taxResult.tds + taxResult.federalWithholding + taxResult.stateWithholding).toString()),
        pfEmployeeYtd: { increment: taxResult.pfEmployee },
        pfEmployerYtd: { increment: taxResult.pfEmployer },
        esiEmployeeYtd: { increment: taxResult.esiEmployee },
        esiEmployerYtd: { increment: taxResult.esiEmployer },
        tdsYtd: { increment: taxResult.tds },
        ptYtd: { increment: taxResult.pt },
        ssEmployeeYtd: { increment: taxResult.ssEmployee },
        ssEmployerYtd: { increment: taxResult.ssEmployer },
        medicareYtd: { increment: taxResult.medicareEmployee + taxResult.medicareEmployer },
        federalTaxYtd: { increment: taxResult.federalWithholding },
        stateTaxYtd: { increment: taxResult.stateWithholding },
      });
    } else {
      await this.repository.createYtd({
        company: { connect: { id: companyId } },
        employee: { connect: { id: employeeId } },
        fiscalYear,
        grossEarningsEncrypted: this.encrypt(grossMonthly.toString()),
        totalDeductionsEncrypted: this.encrypt(taxResult.totalDeductions.toString()),
        taxPaidEncrypted: this.encrypt((taxResult.tds + taxResult.federalWithholding + taxResult.stateWithholding).toString()),
        pfEmployeeYtd: taxResult.pfEmployee,
        pfEmployerYtd: taxResult.pfEmployer,
        esiEmployeeYtd: taxResult.esiEmployee,
        esiEmployerYtd: taxResult.esiEmployer,
        tdsYtd: taxResult.tds,
        ptYtd: taxResult.pt,
        ssEmployeeYtd: taxResult.ssEmployee,
        ssEmployerYtd: taxResult.ssEmployer,
        medicareYtd: taxResult.medicareEmployee + taxResult.medicareEmployer,
        federalTaxYtd: taxResult.federalWithholding,
        stateTaxYtd: taxResult.stateWithholding,
      });
    }
  }

  async getYtd(companyId: string, employeeId: string, fiscalYear: number): Promise<any> {
    const ytd = await this.repository.findYtd(companyId, employeeId, fiscalYear);
    if (!ytd) throw new NotFoundException('YTD data not found');
    return {
      ...ytd,
      grossEarnings: this.safeDecrypt(ytd.grossEarningsEncrypted),
      totalDeductions: this.safeDecrypt(ytd.totalDeductionsEncrypted),
      taxPaid: this.safeDecrypt(ytd.taxPaidEncrypted),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RECONCILIATION
  // ═══════════════════════════════════════════════════════════════════════════════

  async reconcile(companyId: string, month: number, year: number): Promise<ReconciliationResponseDto> {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;

    const currentPayrolls = await this.repository.findPayrollsByPeriod(companyId, month, year);
    const previousPayrolls = await this.repository.findPayrollsByPeriod(companyId, prevMonth, prevYear);

    const currentMap = new Map<string, any>();
    for (const p of currentPayrolls) {
      if (!p.isBonus) currentMap.set(p.employeeId, p);
    }

    const previousMap = new Map<string, any>();
    for (const p of previousPayrolls) {
      if (!p.isBonus) previousMap.set(p.employeeId, p);
    }

    const anomalies: ReconciliationResponseDto['anomalies'] = [];

    // Missing employees (in previous but not in current)
    for (const [empId, prevPayroll] of previousMap) {
      if (!currentMap.has(empId)) {
        const empName = prevPayroll.employee
          ? `${prevPayroll.employee.firstName} ${prevPayroll.employee.lastName}`
          : empId;
        anomalies.push({
          type: 'MISSING',
          employeeId: empId,
          employeeName: empName,
          detail: 'Employee was in previous payroll but missing from current',
          previousAmount: this.safeDecrypt(prevPayroll.grossSalaryEncrypted),
        });
      }
    }

    // New employees and salary changes
    for (const [empId, curPayroll] of currentMap) {
      const empName = curPayroll.employee
        ? `${curPayroll.employee.firstName} ${curPayroll.employee.lastName}`
        : empId;

      if (!previousMap.has(empId)) {
        anomalies.push({
          type: 'NEW',
          employeeId: empId,
          employeeName: empName,
          detail: 'New employee not in previous payroll',
          currentAmount: this.safeDecrypt(curPayroll.grossSalaryEncrypted),
        });
      } else {
        const prevPayroll = previousMap.get(empId)!;
        const prevGross = this.safeDecrypt(prevPayroll.grossSalaryEncrypted);
        const curGross = this.safeDecrypt(curPayroll.grossSalaryEncrypted);

        if (prevGross > 0) {
          const changePercent = ((curGross - prevGross) / prevGross) * 100;
          if (Math.abs(changePercent) > 20) {
            anomalies.push({
              type: 'SALARY_CHANGE',
              employeeId: empId,
              employeeName: empName,
              detail: `Gross salary changed by ${changePercent.toFixed(1)}%`,
              previousAmount: prevGross,
              currentAmount: curGross,
              changePercent: Math.round(changePercent * 10) / 10,
            });
          }
        }

        // Deduction anomaly check (> 30% change)
        const prevDed = this.sumDeductions(prevPayroll);
        const curDed = this.sumDeductions(curPayroll);
        if (prevDed > 0) {
          const dedChange = ((curDed - prevDed) / prevDed) * 100;
          if (Math.abs(dedChange) > 30) {
            anomalies.push({
              type: 'DEDUCTION_CHANGE',
              employeeId: empId,
              employeeName: empName,
              detail: `Total deductions changed by ${dedChange.toFixed(1)}%`,
              previousAmount: prevDed,
              currentAmount: curDed,
              changePercent: Math.round(dedChange * 10) / 10,
            });
          }
        }
      }
    }

    // Summary
    const prevTotal = [...previousMap.values()].reduce((sum, p) => sum + this.safeDecrypt(p.grossSalaryEncrypted), 0);
    const curTotal = [...currentMap.values()].reduce((sum, p) => sum + this.safeDecrypt(p.grossSalaryEncrypted), 0);

    return {
      currentMonth: { month, year },
      previousMonth: { month: prevMonth, year: prevYear },
      summary: {
        totalPayrollVariance: curTotal - prevTotal,
        totalPayrollVariancePercent: prevTotal > 0 ? Math.round(((curTotal - prevTotal) / prevTotal) * 1000) / 10 : 0,
        headcountChange: currentMap.size - previousMap.size,
        averageSalaryChange: currentMap.size > 0 && previousMap.size > 0
          ? Math.round((curTotal / currentMap.size) - (prevTotal / previousMap.size))
          : 0,
      },
      anomalies,
    };
  }

  private sumDeductions(payroll: any): number {
    return parseFloat(payroll.pfEmployee?.toString() || '0') +
      parseFloat(payroll.esiEmployee?.toString() || '0') +
      parseFloat(payroll.tds?.toString() || '0') +
      parseFloat(payroll.pt?.toString() || '0') +
      parseFloat(payroll.ssEmployee?.toString() || '0') +
      parseFloat(payroll.federalTax?.toString() || '0') +
      parseFloat(payroll.stateTax?.toString() || '0');
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // APPROVAL WORKFLOW
  // ═══════════════════════════════════════════════════════════════════════════════

  async submitForApproval(
    batchId: string,
    companyId: string,
    userId: string,
    notes?: string,
  ): Promise<{ submitted: boolean; message: string }> {
    const batch = await this.repository.findBatchById(batchId);
    if (!batch || batch.companyId !== companyId) {
      throw new NotFoundException('Payroll batch not found');
    }

    if (batch.status !== 'COMPLETED' && batch.status !== 'PARTIAL') {
      throw new ConflictException('Only completed batches can be submitted for approval');
    }

    // Check if a PAYROLL workflow template exists
    const workflowTemplate = await this.repository.findWorkflowTemplate(companyId, 'PAYROLL');

    if (!workflowTemplate) {
      return {
        submitted: false,
        message: 'No PAYROLL workflow template configured. Payroll can be directly marked as paid.',
      };
    }

    // Set approval status on all payrolls in the batch
    const payrolls = await this.repository.findPayrollsByBatch(batchId);
    for (const payroll of payrolls) {
      await this.repository.update(payroll.id, { approvalStatus: 'PENDING_APPROVAL' });
    }

    // Start workflow
    try {
      this.eventEmitter.emit('workflow.start', {
        entityType: 'PAYROLL',
        entityId: batchId,
        companyId,
        initiatedBy: userId,
        templateId: workflowTemplate.id,
        notes,
      });
    } catch (err: any) {
      this.serviceLogger.warn(`Failed to start workflow for batch ${batchId}: ${err.message}`);
    }

    this.eventEmitter.emit('payroll.approval.pending', {
      companyId, batchId,
      month: batch.month,
      year: batch.year,
    });

    return { submitted: true, message: 'Payroll batch submitted for approval' };
  }

  @OnEvent('workflow.approved')
  async onWorkflowApproved(event: { entityType: string; entityId: string; companyId: string }) {
    if (event.entityType !== 'PAYROLL') return;
    this.serviceLogger.log(`Workflow approved for PAYROLL batch ${event.entityId}`);

    const payrolls = await this.repository.findPayrollsByBatch(event.entityId);
    for (const payroll of payrolls) {
      await this.repository.update(payroll.id, { approvalStatus: 'APPROVED' });
    }

    this.eventEmitter.emit('payroll.approval.approved', {
      companyId: event.companyId,
      batchId: event.entityId,
    });
  }

  @OnEvent('workflow.rejected')
  async onWorkflowRejected(event: { entityType: string; entityId: string; companyId: string; reason?: string }) {
    if (event.entityType !== 'PAYROLL') return;
    this.serviceLogger.log(`Workflow rejected for PAYROLL batch ${event.entityId}`);

    const payrolls = await this.repository.findPayrollsByBatch(event.entityId);
    for (const payroll of payrolls) {
      await this.repository.update(payroll.id, {
        approvalStatus: 'REJECTED',
        status: 'PROCESSED',
      });
    }

    this.eventEmitter.emit('payroll.approval.rejected', {
      companyId: event.companyId,
      batchId: event.entityId,
      reason: event.reason,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // EMPLOYEE SELF-SERVICE
  // ═══════════════════════════════════════════════════════════════════════════════

  async getMyLatest(companyId: string, employeeId: string): Promise<MyPayslipResponseDto | null> {
    const payroll = await this.repository.findLatestPayroll(companyId, employeeId);
    if (!payroll) return null;
    return this.formatMyPayslip(payroll);
  }

  async getMyHistory(
    companyId: string,
    employeeId: string,
    hasArchive: boolean,
  ): Promise<MyPayslipHistoryResponseDto> {
    if (hasArchive) {
      const payrolls = await this.repository.findEmployeePayrolls(companyId, employeeId);
      return {
        data: payrolls.map((p: any) => this.formatMyPayslip(p)),
        hasArchive: true,
        totalRecords: payrolls.length,
      };
    }

    const latest = await this.repository.findLatestPayroll(companyId, employeeId);
    const totalCount = await this.repository.countEmployeePayrolls(companyId, employeeId);

    return {
      data: latest ? [this.formatMyPayslip(latest)] : [],
      hasArchive: false,
      totalRecords: totalCount,
    };
  }

  async getMyPayroll(
    companyId: string,
    employeeId: string,
    payrollId: string,
    hasArchive: boolean,
  ): Promise<PayrollResponseDto> {
    const payroll = await this.repository.findById(payrollId);
    if (!payroll || payroll.companyId !== companyId || payroll.employeeId !== employeeId) {
      throw new NotFoundException('Payroll record not found');
    }

    if (!hasArchive) {
      const latest = await this.repository.findLatestPayroll(companyId, employeeId);
      if (!latest || latest.id !== payrollId) {
        throw new ForbiddenException('Upgrade to PAYSLIP_ARCHIVE to access historical payslips');
      }
    }

    return this.formatPayroll(payroll);
  }

  async getMyYtd(companyId: string, employeeId: string): Promise<any> {
    const now = new Date();
    const company = await this.repository.findCompany(companyId);
    const country = company?.payrollCountry || 'IN';
    const fiscalYear = this.getFiscalYear(country, now.getMonth() + 1, now.getFullYear());
    return this.getYtd(companyId, employeeId, fiscalYear);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // FORMATTING HELPERS
  // ═══════════════════════════════════════════════════════════════════════════════

  private formatPayroll(payroll: any): PayrollResponseDto {
    return {
      id: payroll.id,
      companyId: payroll.companyId,
      employeeId: payroll.employeeId,
      payPeriodMonth: payroll.payPeriodMonth,
      payPeriodYear: payroll.payPeriodYear,
      payDate: payroll.payDate?.toISOString().split('T')[0],
      basicSalary: this.safeDecrypt(payroll.basicSalaryEncrypted),
      hra: payroll.hraEncrypted ? this.safeDecrypt(payroll.hraEncrypted) : 0,
      specialAllowance: payroll.specialAllowanceEncrypted ? this.safeDecrypt(payroll.specialAllowanceEncrypted) : 0,
      otherAllowances: payroll.otherAllowancesEncrypted ? this.safeDecrypt(payroll.otherAllowancesEncrypted) : 0,
      grossSalary: this.safeDecrypt(payroll.grossSalaryEncrypted),
      netSalary: this.safeDecrypt(payroll.netSalaryEncrypted),
      pfEmployee: parseFloat(payroll.pfEmployee?.toString() || '0'),
      pfEmployer: parseFloat(payroll.pfEmployer?.toString() || '0'),
      esiEmployee: parseFloat(payroll.esiEmployee?.toString() || '0'),
      esiEmployer: parseFloat(payroll.esiEmployer?.toString() || '0'),
      tds: parseFloat(payroll.tds?.toString() || '0'),
      pt: parseFloat(payroll.pt?.toString() || '0'),
      otherDeductions: parseFloat(payroll.otherDeductions?.toString() || '0'),
      daysWorked: payroll.daysWorked,
      daysInMonth: payroll.daysInMonth,
      leaveDays: payroll.leaveDays,
      absentDays: payroll.absentDays,
      overtimeHours: parseFloat(payroll.overtimeHours?.toString() || '0'),
      bankAccount: payroll.bankAccountEncrypted ? this.decrypt(payroll.bankAccountEncrypted) : undefined,
      ifscCode: payroll.ifscCodeEncrypted ? this.decrypt(payroll.ifscCodeEncrypted) : undefined,
      bankName: payroll.bankName,
      status: payroll.status,
      paidAt: payroll.paidAt,
      payslipPath: payroll.payslipPath,
      notes: payroll.notes,
      createdAt: payroll.createdAt,
      updatedAt: payroll.updatedAt,
      ...(payroll.employee && {
        employee: {
          id: payroll.employee.id,
          employeeCode: payroll.employee.employeeCode,
          firstName: payroll.employee.firstName,
          lastName: payroll.employee.lastName,
        },
      }),
    };
  }

  private formatMyPayslip(payroll: any): MyPayslipResponseDto {
    const grossSalary = this.safeDecrypt(payroll.grossSalaryEncrypted);
    const netSalary = this.safeDecrypt(payroll.netSalaryEncrypted);
    const country = payroll.country || 'IN';

    const deductionsBreakdown: Record<string, number> = {};
    if (country === 'IN') {
      if (payroll.pfEmployee > 0) deductionsBreakdown['PF (Employee)'] = parseFloat(payroll.pfEmployee.toString());
      if (payroll.esiEmployee > 0) deductionsBreakdown['ESI (Employee)'] = parseFloat(payroll.esiEmployee.toString());
      if (payroll.tds > 0) deductionsBreakdown['TDS'] = parseFloat(payroll.tds.toString());
      if (payroll.pt > 0) deductionsBreakdown['Professional Tax'] = parseFloat(payroll.pt.toString());
    } else {
      if (payroll.ssEmployee > 0) deductionsBreakdown['Social Security'] = parseFloat(payroll.ssEmployee.toString());
      if (payroll.medicareEmployee > 0) deductionsBreakdown['Medicare'] = parseFloat(payroll.medicareEmployee.toString());
      if (payroll.federalTax > 0) deductionsBreakdown['Federal Tax'] = parseFloat(payroll.federalTax.toString());
      if (payroll.stateTax > 0) deductionsBreakdown['State Tax'] = parseFloat(payroll.stateTax.toString());
    }
    if (payroll.otherDeductions > 0) deductionsBreakdown['Other'] = parseFloat(payroll.otherDeductions.toString());

    const employerContributions: Record<string, number> = {};
    if (country === 'IN') {
      if (payroll.pfEmployer > 0) employerContributions['PF (Employer)'] = parseFloat(payroll.pfEmployer.toString());
      if (payroll.esiEmployer > 0) employerContributions['ESI (Employer)'] = parseFloat(payroll.esiEmployer.toString());
    } else {
      if (payroll.ssEmployer > 0) employerContributions['SS (Employer)'] = parseFloat(payroll.ssEmployer.toString());
      if (payroll.medicareEmployer > 0) employerContributions['Medicare (Employer)'] = parseFloat(payroll.medicareEmployer.toString());
    }

    const totalDeductions = Object.values(deductionsBreakdown).reduce((sum, v) => sum + v, 0);

    return {
      id: payroll.id,
      payPeriodMonth: payroll.payPeriodMonth,
      payPeriodYear: payroll.payPeriodYear,
      payDate: payroll.payDate?.toISOString().split('T')[0],
      grossSalary,
      netSalary,
      totalDeductions,
      status: payroll.status,
      country,
      earningsBreakdown: payroll.earningsBreakdown as Record<string, number> || undefined,
      deductionsBreakdown,
      employerContributions: Object.keys(employerContributions).length > 0 ? employerContributions : undefined,
      computationBreakdown: payroll.computationBreakdown as Record<string, any> || undefined,
      paidAt: payroll.paidAt,
    };
  }

  private formatBatch(batch: any): BatchStatusResponseDto {
    return {
      id: batch.id,
      companyId: batch.companyId,
      month: batch.month,
      year: batch.year,
      status: batch.status,
      totalCount: batch.totalCount,
      processedCount: batch.processedCount,
      failedCount: batch.failedCount,
      errors: batch.errors as any,
      initiatedBy: batch.initiatedBy,
      completedAt: batch.completedAt,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    };
  }
}
