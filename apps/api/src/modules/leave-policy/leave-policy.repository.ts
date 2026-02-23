import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeavePolicyRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Policy CRUD ─────────────────────────────────────────────────────

  async createPolicy(data: Prisma.LeavePolicyCreateInput) {
    return this.prisma.leavePolicy.create({ data });
  }

  async findPolicies(companyId: string) {
    return this.prisma.leavePolicy.findMany({
      where: { companyId },
      orderBy: { leaveType: 'asc' },
    });
  }

  async findPolicyById(id: string, companyId: string) {
    return this.prisma.leavePolicy.findFirst({
      where: { id, companyId },
    });
  }

  async findPolicyByLeaveType(companyId: string, leaveType: string) {
    return this.prisma.leavePolicy.findFirst({
      where: { companyId, leaveType },
    });
  }

  async findActivePolicies(companyId: string) {
    return this.prisma.leavePolicy.findMany({
      where: { companyId, isActive: true },
      orderBy: { leaveType: 'asc' },
    });
  }

  async updatePolicy(id: string, companyId: string, data: Prisma.LeavePolicyUpdateInput) {
    return this.prisma.leavePolicy.update({
      where: { id, companyId },
      data,
    });
  }

  async deletePolicy(id: string, companyId: string) {
    return this.prisma.leavePolicy.delete({
      where: { id, companyId },
    });
  }

  // ─── Balance Operations ──────────────────────────────────────────────

  async findBalance(companyId: string, employeeId: string, leaveType: string, fiscalYear: number) {
    return this.prisma.leaveBalance.findFirst({
      where: { companyId, employeeId, leaveType, fiscalYear },
      include: { ledger: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
  }

  async findBalances(companyId: string, employeeId: string, fiscalYear?: number) {
    return this.prisma.leaveBalance.findMany({
      where: {
        companyId,
        employeeId,
        ...(fiscalYear !== undefined && { fiscalYear }),
      },
      include: { ledger: { orderBy: { createdAt: 'desc' }, take: 5 } },
      orderBy: { leaveType: 'asc' },
    });
  }

  async upsertBalance(data: {
    companyId: string;
    employeeId: string;
    leaveType: string;
    fiscalYear: number;
    entitled?: number;
    accrued?: number;
    used?: number;
    carriedOver?: number;
    adjusted?: number;
  }) {
    const { companyId, employeeId, leaveType, fiscalYear, ...fields } = data;

    return this.prisma.leaveBalance.upsert({
      where: {
        companyId_employeeId_leaveType_fiscalYear: {
          companyId,
          employeeId,
          leaveType,
          fiscalYear,
        },
      },
      create: {
        company: { connect: { id: companyId } },
        employee: { connect: { id: employeeId } },
        leaveType,
        fiscalYear,
        entitled: fields.entitled ?? 0,
        accrued: fields.accrued ?? 0,
        used: fields.used ?? 0,
        carriedOver: fields.carriedOver ?? 0,
        adjusted: fields.adjusted ?? 0,
      },
      update: {
        ...(fields.entitled !== undefined && { entitled: fields.entitled }),
        ...(fields.accrued !== undefined && { accrued: fields.accrued }),
        ...(fields.used !== undefined && { used: fields.used }),
        ...(fields.carriedOver !== undefined && { carriedOver: fields.carriedOver }),
        ...(fields.adjusted !== undefined && { adjusted: fields.adjusted }),
      },
    });
  }

  // ─── Ledger Operations ───────────────────────────────────────────────

  async createLedgerEntry(data: {
    balanceId: string;
    transactionType: string;
    amount: number;
    runningBalance: number;
    description?: string;
    referenceId?: string;
  }) {
    return this.prisma.leaveBalanceLedger.create({
      data: {
        balance: { connect: { id: data.balanceId } },
        transactionType: data.transactionType,
        amount: data.amount,
        runningBalance: data.runningBalance,
        ...(data.description && { description: data.description }),
        ...(data.referenceId && { referenceId: data.referenceId }),
      },
    });
  }

  async findLedgerEntries(balanceId: string) {
    return this.prisma.leaveBalanceLedger.findMany({
      where: { balanceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Employee Queries ────────────────────────────────────────────────

  async findActiveEmployees(companyId: string) {
    return this.prisma.employee.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        gender: true,
        dateOfJoining: true,
      },
    });
  }

  async findEmployeeByUserId(companyId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId },
      select: { employeeId: true },
    });
    return user?.employeeId ?? null;
  }

  // ─── Audit Log ───────────────────────────────────────────────────────

  async createAuditLog(data: {
    userId: string;
    companyId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
  }) {
    return this.prisma.auditLog.create({ data });
  }
}
