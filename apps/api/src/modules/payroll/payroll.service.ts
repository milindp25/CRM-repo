import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';
import { PayrollRepository } from './payroll.repository';
import {
  CreatePayrollDto,
  UpdatePayrollDto,
  PayrollFilterDto,
  PayrollResponseDto,
  PayrollPaginationResponseDto,
  ProcessPayrollDto,
  MarkPaidDto,
} from './dto';

@Injectable()
export class PayrollService {
  private readonly algorithm = 'aes-256-cbc';
  private readonly encryptionKey: string;

  constructor(
    private readonly repository: PayrollRepository,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly cache: CacheService,
  ) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key) {
      throw new Error('ENCRYPTION_KEY is not configured');
    }
    // Use first 32 bytes of the key for AES-256
    this.encryptionKey = key.substring(0, 64);
  }

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
      company: { connect: { id: companyId } },
      employee: { connect: { id: dto.employeeId } },
    };

    const payroll = await this.repository.create(createData);

    // Invalidate payroll cache
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

      if (filter.employeeId) {
        where.employeeId = filter.employeeId;
      }
      if (filter.status) {
        where.status = filter.status;
      }
      if (filter.month) {
        where.payPeriodMonth = filter.month;
      }
      if (filter.year) {
        where.payPeriodYear = filter.year;
      }
      if (filter.startDate || filter.endDate) {
        where.payDate = {};
        if (filter.startDate) {
          where.payDate.gte = filter.startDate;
        }
        if (filter.endDate) {
          where.payDate.lte = filter.endDate;
        }
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

    // Update basic fields
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

    // Invalidate payroll cache
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

    // Invalidate payroll cache
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

    const updateData: Prisma.PayrollUpdateInput = {
      status: 'PROCESSED',
      ...(dto.notes && { notes: dto.notes }),
    };

    const updated = await this.repository.update(id, updateData);

    // Invalidate payroll cache
    this.cache.invalidateByPrefix('payroll:');

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'PAYROLL',
      resourceId: id,
      newValues: { status: 'PROCESSED' },
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

    const updateData: Prisma.PayrollUpdateInput = {
      status: 'PAID',
      paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
      ...(dto.notes && { notes: dto.notes }),
    };

    const updated = await this.repository.update(id, updateData);

    // Invalidate payroll cache
    this.cache.invalidateByPrefix('payroll:');

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'PAYROLL',
      resourceId: id,
      newValues: { status: 'PAID', paidAt: updateData.paidAt },
    });

    return this.formatPayroll(updated);
  }

  private formatPayroll(payroll: any): PayrollResponseDto {
    return {
      id: payroll.id,
      companyId: payroll.companyId,
      employeeId: payroll.employeeId,
      payPeriodMonth: payroll.payPeriodMonth,
      payPeriodYear: payroll.payPeriodYear,
      payDate: payroll.payDate?.toISOString().split('T')[0],
      basicSalary: parseFloat(this.decrypt(payroll.basicSalaryEncrypted)),
      hra: payroll.hraEncrypted ? parseFloat(this.decrypt(payroll.hraEncrypted)) : 0,
      specialAllowance: payroll.specialAllowanceEncrypted ? parseFloat(this.decrypt(payroll.specialAllowanceEncrypted)) : 0,
      otherAllowances: payroll.otherAllowancesEncrypted ? parseFloat(this.decrypt(payroll.otherAllowancesEncrypted)) : 0,
      grossSalary: parseFloat(this.decrypt(payroll.grossSalaryEncrypted)),
      netSalary: parseFloat(this.decrypt(payroll.netSalaryEncrypted)),
      pfEmployee: parseFloat(payroll.pfEmployee.toString()),
      pfEmployer: parseFloat(payroll.pfEmployer.toString()),
      esiEmployee: parseFloat(payroll.esiEmployee.toString()),
      esiEmployer: parseFloat(payroll.esiEmployer.toString()),
      tds: parseFloat(payroll.tds.toString()),
      pt: parseFloat(payroll.pt.toString()),
      otherDeductions: parseFloat(payroll.otherDeductions.toString()),
      daysWorked: payroll.daysWorked,
      daysInMonth: payroll.daysInMonth,
      leaveDays: payroll.leaveDays,
      absentDays: payroll.absentDays,
      overtimeHours: parseFloat(payroll.overtimeHours.toString()),
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
}
