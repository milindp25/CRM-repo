import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmployeeService } from '../employee/employee.service';
import { PayrollService } from '../payroll/payroll.service';
import { PayrollPageData } from './types/page.types';

// TS1272 workaround
interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: string;
  permissions: string[];
}

@Resolver()
export class PayrollPageResolver {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly payrollService: PayrollService,
  ) {}

  @Query(() => PayrollPageData, { name: 'payrollPage' })
  async getPayrollPage(
    @Args({ name: 'month', type: () => Int, nullable: true }) month: number | null,
    @Args({ name: 'year', type: () => Int, nullable: true }) year: number | null,
    @CurrentUser() user: JwtPayload,
  ): Promise<PayrollPageData> {
    const { companyId } = user;

    const filter: any = { page: 1, limit: 100 };
    if (month) filter.payPeriodMonth = month;
    if (year) filter.payPeriodYear = year;

    const [employeesResult, payrollResult, batchesResult] = await Promise.all([
      this.employeeService.findAll(companyId, { page: 1, limit: 500 }),
      this.payrollService.findAll(companyId, filter),
      this.payrollService.listBatches(companyId),
    ]);

    const employees = (employeesResult?.data || []).map((e: any) => ({
      id: e.id,
      employeeCode: e.employeeCode ?? undefined,
      firstName: e.firstName,
      lastName: e.lastName,
    }));

    const batches = (batchesResult || []).map((b: any) => ({
      id: b.id ?? b.batchId ?? '',
      month: b.payPeriodMonth ?? b.month ?? 0,
      year: b.payPeriodYear ?? b.year ?? 0,
      status: b.status ?? 'UNKNOWN',
      totalCount: b.totalCount ?? b.total ?? undefined,
      processedCount: b.processedCount ?? b.processed ?? undefined,
      failedCount: b.failedCount ?? b.failed ?? undefined,
    }));

    const records = (payrollResult?.data || []).map((r: any) => ({
      id: r.id,
      employeeId: r.employeeId ?? undefined,
      employee: r.employee ? {
        id: r.employee.id ?? r.employeeId ?? '',
        employeeCode: r.employee.employeeCode ?? undefined,
        firstName: r.employee.firstName ?? '',
        lastName: r.employee.lastName ?? '',
      } : undefined,
      grossSalary: r.grossSalary ?? 0,
      netSalary: r.netSalary ?? 0,
      status: r.status ?? 'UNKNOWN',
      approvalStatus: r.approvalStatus ?? undefined,
    }));

    return { employees, batches, records };
  }
}
