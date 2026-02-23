import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { LoggerService } from '../../common/services/logger.service';
import { LeavePolicyRepository } from './leave-policy.repository';
import { CreatePolicyDto, UpdatePolicyDto, AdjustBalanceDto } from './dto';

@Injectable()
export class LeavePolicyService {
  constructor(
    private readonly repository: LeavePolicyRepository,
    private readonly logger: LoggerService,
  ) {}

  // ─── Policy CRUD ─────────────────────────────────────────────────────

  async createPolicy(companyId: string, userId: string, dto: CreatePolicyDto) {
    this.logger.log(`Creating leave policy: ${dto.leaveType} for company ${companyId}`);

    // Check for duplicate leaveType within the company
    const existing = await this.repository.findPolicyByLeaveType(companyId, dto.leaveType);
    if (existing) {
      throw new ConflictException(
        `A leave policy for type "${dto.leaveType}" already exists in this company`,
      );
    }

    const policy = await this.repository.createPolicy({
      company: { connect: { id: companyId } },
      leaveType: dto.leaveType,
      name: dto.name,
      annualEntitlement: dto.annualEntitlement,
      accrualType: dto.accrualType,
      carryoverLimit: dto.carryoverLimit ?? 0,
      ...(dto.carryoverExpiryMonths !== undefined && {
        carryoverExpiryMonths: dto.carryoverExpiryMonths,
      }),
      ...(dto.maxConsecutiveDays !== undefined && {
        maxConsecutiveDays: dto.maxConsecutiveDays,
      }),
      ...(dto.minServiceDaysRequired !== undefined && {
        minServiceDaysRequired: dto.minServiceDaysRequired,
      }),
      ...(dto.applicableGender !== undefined && {
        applicableGender: dto.applicableGender,
      }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.fiscalYearStart !== undefined && {
        fiscalYearStart: dto.fiscalYearStart,
      }),
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'LEAVE_POLICY',
      resourceId: policy.id,
      newValues: {
        leaveType: dto.leaveType,
        name: dto.name,
        annualEntitlement: dto.annualEntitlement,
        accrualType: dto.accrualType,
      },
    });

    return policy;
  }

  async getPolicies(companyId: string) {
    this.logger.log(`Fetching leave policies for company ${companyId}`);
    return this.repository.findPolicies(companyId);
  }

  async getPolicy(id: string, companyId: string) {
    this.logger.log(`Fetching leave policy ${id}`);
    const policy = await this.repository.findPolicyById(id, companyId);
    if (!policy) {
      throw new NotFoundException('Leave policy not found');
    }
    return policy;
  }

  async updatePolicy(id: string, companyId: string, userId: string, dto: UpdatePolicyDto) {
    this.logger.log(`Updating leave policy ${id}`);

    const existing = await this.repository.findPolicyById(id, companyId);
    if (!existing) {
      throw new NotFoundException('Leave policy not found');
    }

    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.annualEntitlement !== undefined) updateData.annualEntitlement = dto.annualEntitlement;
    if (dto.accrualType !== undefined) updateData.accrualType = dto.accrualType;
    if (dto.carryoverLimit !== undefined) updateData.carryoverLimit = dto.carryoverLimit;
    if (dto.carryoverExpiryMonths !== undefined)
      updateData.carryoverExpiryMonths = dto.carryoverExpiryMonths;
    if (dto.maxConsecutiveDays !== undefined)
      updateData.maxConsecutiveDays = dto.maxConsecutiveDays;
    if (dto.minServiceDaysRequired !== undefined)
      updateData.minServiceDaysRequired = dto.minServiceDaysRequired;
    if (dto.applicableGender !== undefined) updateData.applicableGender = dto.applicableGender;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.fiscalYearStart !== undefined) updateData.fiscalYearStart = dto.fiscalYearStart;

    const updated = await this.repository.updatePolicy(id, companyId, updateData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'LEAVE_POLICY',
      resourceId: id,
      oldValues: {
        name: existing.name,
        annualEntitlement: existing.annualEntitlement,
        accrualType: existing.accrualType,
      },
      newValues: dto,
    });

    return updated;
  }

  async deletePolicy(id: string, companyId: string, userId: string) {
    this.logger.log(`Deleting leave policy ${id}`);

    const existing = await this.repository.findPolicyById(id, companyId);
    if (!existing) {
      throw new NotFoundException('Leave policy not found');
    }

    await this.repository.deletePolicy(id, companyId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'LEAVE_POLICY',
      resourceId: id,
      oldValues: {
        leaveType: existing.leaveType,
        name: existing.name,
      },
    });

    return { message: 'Leave policy deleted successfully' };
  }

  // ─── Balance Operations ──────────────────────────────────────────────

  async getBalances(companyId: string, employeeId: string, fiscalYear?: number) {
    this.logger.log(`Fetching leave balances for employee ${employeeId}`);

    const balances = await this.repository.findBalances(companyId, employeeId, fiscalYear);

    return balances.map((balance) => ({
      ...balance,
      available: this.computeAvailable(balance),
    }));
  }

  async getMyBalances(companyId: string, userId: string) {
    this.logger.log(`Fetching own leave balances for user ${userId}`);

    const employeeId = await this.repository.findEmployeeByUserId(companyId, userId);
    if (!employeeId) {
      throw new NotFoundException('No employee record linked to this user');
    }

    const currentYear = new Date().getFullYear();
    return this.getBalances(companyId, employeeId, currentYear);
  }

  async adjustBalance(companyId: string, userId: string, dto: AdjustBalanceDto) {
    const { employeeId, leaveType, amount, description } = dto;
    const fiscalYear = dto.fiscalYear ?? new Date().getFullYear();

    this.logger.log(
      `Adjusting balance for employee ${employeeId}: ${leaveType} by ${amount} for FY ${fiscalYear}`,
    );

    // Ensure a balance record exists (upsert)
    let balance = await this.repository.findBalance(companyId, employeeId, leaveType, fiscalYear);

    if (!balance) {
      // Create a zero balance first
      await this.repository.upsertBalance({
        companyId,
        employeeId,
        leaveType,
        fiscalYear,
      });
      // Re-fetch with ledger
      balance = await this.repository.findBalance(companyId, employeeId, leaveType, fiscalYear);
    }

    if (!balance) {
      throw new BadRequestException('Failed to create leave balance record');
    }

    // Update the adjusted field
    const currentAdjusted = Number(balance.adjusted);
    const newAdjusted = currentAdjusted + amount;

    const updated = await this.repository.upsertBalance({
      companyId,
      employeeId,
      leaveType,
      fiscalYear,
      adjusted: newAdjusted,
    });

    // Calculate running balance: entitled + accrued + carriedOver + adjusted - used
    const runningBalance =
      Number(updated.entitled) +
      Number(updated.accrued) +
      Number(updated.carriedOver) +
      Number(updated.adjusted) -
      Number(updated.used);

    // Create ledger entry
    await this.repository.createLedgerEntry({
      balanceId: balance.id,
      transactionType: 'ADJUSTMENT',
      amount,
      runningBalance,
      description: description ?? `Manual adjustment by admin`,
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'LEAVE_BALANCE',
      resourceId: balance.id,
      newValues: { employeeId, leaveType, fiscalYear, adjustmentAmount: amount, description },
    });

    return {
      ...updated,
      available: runningBalance,
    };
  }

  async deductBalance(
    companyId: string,
    employeeId: string,
    leaveType: string,
    days: number,
    referenceId?: string,
  ) {
    const fiscalYear = new Date().getFullYear();
    this.logger.log(
      `Deducting ${days} days from ${leaveType} balance for employee ${employeeId}`,
    );

    let balance = await this.repository.findBalance(companyId, employeeId, leaveType, fiscalYear);

    if (!balance) {
      // Auto-create balance record with 0 values
      await this.repository.upsertBalance({
        companyId,
        employeeId,
        leaveType,
        fiscalYear,
      });
      balance = await this.repository.findBalance(companyId, employeeId, leaveType, fiscalYear);
    }

    if (!balance) {
      throw new BadRequestException('Failed to create leave balance record');
    }

    const available = this.computeAvailable(balance);
    if (days > available) {
      throw new BadRequestException(
        `Insufficient leave balance. Available: ${available}, requested: ${days}`,
      );
    }

    const newUsed = Number(balance.used) + days;
    const updated = await this.repository.upsertBalance({
      companyId,
      employeeId,
      leaveType,
      fiscalYear,
      used: newUsed,
    });

    const runningBalance =
      Number(updated.entitled) +
      Number(updated.accrued) +
      Number(updated.carriedOver) +
      Number(updated.adjusted) -
      Number(updated.used);

    await this.repository.createLedgerEntry({
      balanceId: balance.id,
      transactionType: 'USAGE',
      amount: -days,
      runningBalance,
      description: `Leave deduction`,
      referenceId,
    });

    return updated;
  }

  async restoreBalance(
    companyId: string,
    employeeId: string,
    leaveType: string,
    days: number,
    referenceId?: string,
  ) {
    const fiscalYear = new Date().getFullYear();
    this.logger.log(
      `Restoring ${days} days to ${leaveType} balance for employee ${employeeId}`,
    );

    const balance = await this.repository.findBalance(
      companyId,
      employeeId,
      leaveType,
      fiscalYear,
    );

    if (!balance) {
      throw new NotFoundException('Leave balance not found');
    }

    const newUsed = Math.max(0, Number(balance.used) - days);
    const updated = await this.repository.upsertBalance({
      companyId,
      employeeId,
      leaveType,
      fiscalYear,
      used: newUsed,
    });

    const runningBalance =
      Number(updated.entitled) +
      Number(updated.accrued) +
      Number(updated.carriedOver) +
      Number(updated.adjusted) -
      Number(updated.used);

    await this.repository.createLedgerEntry({
      balanceId: balance.id,
      transactionType: 'ADJUSTMENT',
      amount: days,
      runningBalance,
      description: `Leave cancellation - balance restored`,
      referenceId,
    });

    return updated;
  }

  // ─── Bulk Operations ─────────────────────────────────────────────────

  async grantAnnualEntitlements(companyId: string, userId: string) {
    this.logger.log(`Granting annual entitlements for company ${companyId}`);

    const policies = await this.repository.findActivePolicies(companyId);
    if (policies.length === 0) {
      throw new BadRequestException('No active leave policies found');
    }

    const employees = await this.repository.findActiveEmployees(companyId);
    if (employees.length === 0) {
      throw new BadRequestException('No active employees found');
    }

    const currentYear = new Date().getFullYear();
    let granted = 0;
    let skipped = 0;

    for (const policy of policies) {
      for (const employee of employees) {
        // Check gender applicability
        if (policy.applicableGender && employee.gender !== policy.applicableGender) {
          skipped++;
          continue;
        }

        // Check minimum service days
        if (policy.minServiceDaysRequired && employee.dateOfJoining) {
          const serviceDays = Math.floor(
            (Date.now() - new Date(employee.dateOfJoining).getTime()) / (1000 * 60 * 60 * 24),
          );
          if (serviceDays < policy.minServiceDaysRequired) {
            skipped++;
            continue;
          }
        }

        const entitlement = Number(policy.annualEntitlement);

        // Check if already granted for this year
        const existingBalance = await this.repository.findBalance(
          companyId,
          employee.id,
          policy.leaveType,
          currentYear,
        );

        if (existingBalance && Number(existingBalance.entitled) > 0) {
          skipped++;
          continue;
        }

        // Upsert balance with entitlement
        const balance = await this.repository.upsertBalance({
          companyId,
          employeeId: employee.id,
          leaveType: policy.leaveType,
          fiscalYear: currentYear,
          entitled: entitlement,
        });

        // Create ledger entry
        await this.repository.createLedgerEntry({
          balanceId: balance.id,
          transactionType: 'GRANT',
          amount: entitlement,
          runningBalance: entitlement + Number(balance.carriedOver) + Number(balance.adjusted),
          description: `Annual entitlement grant for FY ${currentYear}`,
        });

        granted++;
      }
    }

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'LEAVE_BALANCE',
      newValues: { type: 'annual_grant', fiscalYear: currentYear, granted, skipped },
    });

    return {
      message: 'Annual entitlements granted successfully',
      fiscalYear: currentYear,
      policiesProcessed: policies.length,
      employeesProcessed: employees.length,
      granted,
      skipped,
    };
  }

  async runMonthlyAccrual(companyId: string, userId: string) {
    this.logger.log(`Running monthly accrual for company ${companyId}`);

    const policies = await this.repository.findActivePolicies(companyId);
    const accrualPolicies = policies.filter((p) => p.accrualType === 'MONTHLY_ACCRUAL');

    if (accrualPolicies.length === 0) {
      throw new BadRequestException('No monthly accrual policies found');
    }

    const employees = await this.repository.findActiveEmployees(companyId);
    if (employees.length === 0) {
      throw new BadRequestException('No active employees found');
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12
    let accrued = 0;
    let skipped = 0;

    for (const policy of accrualPolicies) {
      const monthlyAccrual = Number(policy.annualEntitlement) / 12;

      for (const employee of employees) {
        // Check gender applicability
        if (policy.applicableGender && employee.gender !== policy.applicableGender) {
          skipped++;
          continue;
        }

        // Check minimum service days
        if (policy.minServiceDaysRequired && employee.dateOfJoining) {
          const serviceDays = Math.floor(
            (Date.now() - new Date(employee.dateOfJoining).getTime()) / (1000 * 60 * 60 * 24),
          );
          if (serviceDays < policy.minServiceDaysRequired) {
            skipped++;
            continue;
          }
        }

        // Get or create balance
        let balance = await this.repository.findBalance(
          companyId,
          employee.id,
          policy.leaveType,
          currentYear,
        );

        if (!balance) {
          await this.repository.upsertBalance({
            companyId,
            employeeId: employee.id,
            leaveType: policy.leaveType,
            fiscalYear: currentYear,
          });
          balance = await this.repository.findBalance(
            companyId,
            employee.id,
            policy.leaveType,
            currentYear,
          );
        }

        if (!balance) {
          skipped++;
          continue;
        }

        // Update accrued amount
        const newAccrued = Number(balance.accrued) + monthlyAccrual;
        const updated = await this.repository.upsertBalance({
          companyId,
          employeeId: employee.id,
          leaveType: policy.leaveType,
          fiscalYear: currentYear,
          accrued: Math.round(newAccrued * 10) / 10, // Round to 1 decimal
        });

        const runningBalance =
          Number(updated.entitled) +
          Number(updated.accrued) +
          Number(updated.carriedOver) +
          Number(updated.adjusted) -
          Number(updated.used);

        // Create ledger entry
        await this.repository.createLedgerEntry({
          balanceId: balance.id,
          transactionType: 'ACCRUAL',
          amount: Math.round(monthlyAccrual * 10) / 10,
          runningBalance,
          description: `Monthly accrual for ${currentYear}-${String(currentMonth).padStart(2, '0')}`,
        });

        accrued++;
      }
    }

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'LEAVE_BALANCE',
      newValues: {
        type: 'monthly_accrual',
        fiscalYear: currentYear,
        month: currentMonth,
        accrued,
        skipped,
      },
    });

    return {
      message: 'Monthly accrual completed successfully',
      fiscalYear: currentYear,
      month: currentMonth,
      policiesProcessed: accrualPolicies.length,
      employeesProcessed: employees.length,
      accrued,
      skipped,
    };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  private computeAvailable(balance: {
    entitled: any;
    accrued: any;
    carriedOver: any;
    adjusted: any;
    used: any;
  }): number {
    return (
      Number(balance.entitled) +
      Number(balance.accrued) +
      Number(balance.carriedOver) +
      Number(balance.adjusted) -
      Number(balance.used)
    );
  }
}
