import { Resolver, Query, Args } from '@nestjs/graphql';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ShiftService } from '../shift/shift.service';
import { ShiftPageData } from './types/page.types';

// TS1272 workaround
interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: string;
  permissions: string[];
}

@Resolver()
export class ShiftPageResolver {
  constructor(
    private readonly shiftService: ShiftService,
  ) {}

  @Query(() => ShiftPageData, { name: 'shiftPage' })
  async getShiftPage(
    @Args({ name: 'tab', type: () => String, nullable: true }) tab: string | null,
    @CurrentUser() user: JwtPayload,
  ): Promise<ShiftPageData> {
    const { companyId } = user;

    const [definitionsResult, assignmentsResult] = await Promise.all([
      this.shiftService.findAllDefinitions(companyId, { page: 1, limit: 100 }),
      this.shiftService.findAssignments(companyId, { page: 1, limit: 200 }),
    ]);

    const definitions = (definitionsResult?.data || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      code: d.code ?? undefined,
      startTime: d.startTime ?? '',
      endTime: d.endTime ?? '',
      breakDuration: d.breakDuration ?? undefined,
      isActive: d.isActive ?? undefined,
      isOvernight: d.isOvernight ?? undefined,
    }));

    const allAssignments = (assignmentsResult?.data || []).map((a: any) => ({
      id: a.id,
      employeeId: a.employeeId ?? '',
      shiftId: a.shiftId ?? a.shiftDefinitionId ?? '',
      assignmentDate: a.assignmentDate ? (typeof a.assignmentDate === 'string' ? a.assignmentDate : a.assignmentDate.toISOString().split('T')[0]) : undefined,
      endDate: a.endDate ? (typeof a.endDate === 'string' ? a.endDate : a.endDate.toISOString().split('T')[0]) : undefined,
      shift: a.shift ? {
        id: a.shift.id,
        name: a.shift.name,
        code: a.shift.code ?? undefined,
        startTime: a.shift.startTime ?? '',
        endTime: a.shift.endTime ?? '',
        breakDuration: a.shift.breakDuration ?? undefined,
        isActive: a.shift.isActive ?? undefined,
        isOvernight: a.shift.isOvernight ?? undefined,
      } : undefined,
    }));

    // For "my" assignments, we would ideally filter by the current user's employeeId.
    // Since JwtPayload does not include employeeId, return all for now.
    // The frontend can filter client-side based on the logged-in employee.
    const myAssignments = allAssignments;

    return { definitions, assignments: allAssignments, myAssignments };
  }
}
