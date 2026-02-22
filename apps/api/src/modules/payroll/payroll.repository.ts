import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const EMPLOYEE_SELECT = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  state: true,
  taxRegime: true,
  filingStatus: true,
  w4Allowances: true,
  salaryStructureId: true,
  annualCtc: true,
};

@Injectable()
export class PayrollRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Payroll CRUD ──────────────────────────────────────────────────────────

  async create(data: Prisma.PayrollCreateInput) {
    return this.prisma.payroll.create({
      data,
      include: {
        employee: { select: EMPLOYEE_SELECT },
      },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.PayrollWhereInput;
    orderBy?: Prisma.PayrollOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    return this.prisma.payroll.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        employee: { select: EMPLOYEE_SELECT },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.payroll.findUnique({
      where: { id },
      include: {
        employee: { select: EMPLOYEE_SELECT },
      },
    });
  }

  async update(id: string, data: Prisma.PayrollUpdateInput) {
    return this.prisma.payroll.update({
      where: { id },
      data,
      include: {
        employee: { select: EMPLOYEE_SELECT },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.payroll.delete({ where: { id } });
  }

  // ─── Payroll Queries ───────────────────────────────────────────────────────

  async findPayrollsByPeriod(companyId: string, month: number, year: number) {
    return this.prisma.payroll.findMany({
      where: { companyId, payPeriodMonth: month, payPeriodYear: year },
      include: {
        employee: { select: EMPLOYEE_SELECT },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPayrollsByBatch(batchId: string) {
    return this.prisma.payroll.findMany({
      where: { batchId },
      include: {
        employee: { select: EMPLOYEE_SELECT },
      },
    });
  }

  async findLatestPayroll(companyId: string, employeeId: string) {
    return this.prisma.payroll.findFirst({
      where: { companyId, employeeId, status: { in: ['PROCESSED', 'PAID'] } },
      orderBy: [{ payPeriodYear: 'desc' }, { payPeriodMonth: 'desc' }, { createdAt: 'desc' }],
      include: {
        employee: { select: EMPLOYEE_SELECT },
      },
    });
  }

  async findEmployeePayrolls(companyId: string, employeeId: string) {
    return this.prisma.payroll.findMany({
      where: { companyId, employeeId },
      orderBy: [{ payPeriodYear: 'desc' }, { payPeriodMonth: 'desc' }],
      include: {
        employee: { select: EMPLOYEE_SELECT },
      },
    });
  }

  async countEmployeePayrolls(companyId: string, employeeId: string): Promise<number> {
    return this.prisma.payroll.count({
      where: { companyId, employeeId },
    });
  }

  // ─── Company & Employee ────────────────────────────────────────────────────

  async findCompany(companyId: string) {
    return this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        companyName: true,
        payrollCountry: true,
        payFrequency: true,
        pfEnabled: true,
        esiEnabled: true,
        emailPayslipEnabled: true,
        companyPanEncrypted: true,
        einEncrypted: true,
      },
    });
  }

  async findEmployee(employeeId: string, companyId: string) {
    return this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      select: {
        ...EMPLOYEE_SELECT,
        workEmail: true,
        panEncrypted: true,
        ssnEncrypted: true,
        uanEncrypted: true,
      },
    });
  }

  async findActiveEmployeesWithStructures(companyId: string) {
    return this.prisma.employee.findMany({
      where: {
        companyId,
        isActive: true,
        salaryStructureId: { not: null },
      },
      select: { id: true, firstName: true, lastName: true },
    });
  }

  // ─── Salary Structure ──────────────────────────────────────────────────────

  async findSalaryStructure(id: string) {
    return this.prisma.salaryStructure.findUnique({
      where: { id },
    });
  }

  // ─── Batch ─────────────────────────────────────────────────────────────────

  async createBatch(data: Prisma.PayrollBatchCreateInput) {
    return this.prisma.payrollBatch.create({ data });
  }

  async findBatch(companyId: string, month: number, year: number) {
    return this.prisma.payrollBatch.findUnique({
      where: { companyId_month_year: { companyId, month, year } },
    });
  }

  async findBatchById(id: string) {
    return this.prisma.payrollBatch.findUnique({ where: { id } });
  }

  async findBatches(companyId: string) {
    return this.prisma.payrollBatch.findMany({
      where: { companyId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async updateBatch(id: string, data: Prisma.PayrollBatchUpdateInput) {
    return this.prisma.payrollBatch.update({ where: { id }, data });
  }

  // ─── YTD ───────────────────────────────────────────────────────────────────

  async findYtd(companyId: string, employeeId: string, fiscalYear: number) {
    return this.prisma.payrollYTD.findUnique({
      where: { companyId_employeeId_fiscalYear: { companyId, employeeId, fiscalYear } },
    });
  }

  async createYtd(data: Prisma.PayrollYTDCreateInput) {
    return this.prisma.payrollYTD.create({ data });
  }

  async updateYtd(id: string, data: Prisma.PayrollYTDUpdateInput) {
    return this.prisma.payrollYTD.update({ where: { id }, data });
  }

  // ─── Workflow Template ─────────────────────────────────────────────────────

  async findWorkflowTemplate(companyId: string, entityType: string) {
    return this.prisma.workflowTemplate.findFirst({
      where: { companyId, entityType, isActive: true },
    });
  }

  // ─── Audit Log ─────────────────────────────────────────────────────────────

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
