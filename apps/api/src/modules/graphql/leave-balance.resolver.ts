import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmployeeService } from '../employee/employee.service';
import { LeaveService } from '../leave/leave.service';
import { LeaveBalancePageData } from './types/page.types';

// TS1272 workaround
interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: string;
  permissions: string[];
}

@Resolver()
export class LeaveBalanceResolver {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly leaveService: LeaveService,
  ) {}

  @Query(() => LeaveBalancePageData, { name: 'leaveBalancePage' })
  async getLeaveBalancePage(
    @Args({ name: 'year', type: () => Int }) year: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<LeaveBalancePageData> {
    const { companyId } = user;

    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const [employeesResult, leavesResult] = await Promise.all([
      this.employeeService.findAll(companyId, { page: 1, limit: 500 }),
      this.leaveService.findAll(companyId, {
        startDate,
        endDate,
        page: 1,
        limit: 1000,
      }),
    ]);

    const employees = (employeesResult?.data || []).map((e: any) => ({
      id: e.id,
      employeeCode: e.employeeCode ?? undefined,
      firstName: e.firstName,
      lastName: e.lastName,
      departmentName: e.department?.name ?? undefined,
    }));

    const leaves = (leavesResult?.data || []).map((l: any) => ({
      id: l.id,
      employeeId: l.employeeId ?? l.employee?.id ?? '',
      leaveType: l.leaveType,
      status: l.status,
      totalDays: l.totalDays,
      startDate: typeof l.startDate === 'string' ? l.startDate : l.startDate?.toISOString?.()?.split('T')[0] || '',
      endDate: typeof l.endDate === 'string' ? l.endDate : l.endDate?.toISOString?.()?.split('T')[0] || '',
    }));

    return { employees, leaves };
  }
}
