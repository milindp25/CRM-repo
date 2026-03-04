import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EmployeeService } from '../employee/employee.service';
import { AttendanceService } from '../attendance/attendance.service';
import { LeaveService } from '../leave/leave.service';
import { PayrollService } from '../payroll/payroll.service';
import { SocialService } from '../social/social.service';
import { AuditService } from '../audit/audit.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { RecruitmentService } from '../recruitment/recruitment.service';
import {
  DashboardData,
  StatsOverviewData,
  AttendanceRecord,
  LeaveRecord,
  PayslipRecord,
  TeamAttendanceData,
  AnnouncementRecord,
  KudosRecord,
  BirthdayRecord,
  AnalyticsOverviewData,
  JobPostingRecord,
  AuditLogRecord,
} from './types/dashboard.types';

// TS1272 workaround: define JwtPayload locally instead of importing
interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: string;
  permissions: string[];
}

@Resolver()
export class DashboardResolver {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly attendanceService: AttendanceService,
    private readonly leaveService: LeaveService,
    private readonly payrollService: PayrollService,
    private readonly socialService: SocialService,
    private readonly auditService: AuditService,
    private readonly analyticsService: AnalyticsService,
    private readonly recruitmentService: RecruitmentService,
  ) {}

  @Query(() => DashboardData, { name: 'dashboardData' })
  async getDashboardData(
    @Args({ name: 'widgetIds', type: () => [String] }) widgetIds: string[],
    @CurrentUser() user: JwtPayload,
  ): Promise<DashboardData> {
    const { companyId, userId, role } = user;
    const result: DashboardData = {};

    // Determine which shared data sets are needed
    const needsEmployees = widgetIds.some((id) =>
      ['stats_overview', 'team_attendance', 'birthdays'].includes(id),
    );
    const needsAttendance = widgetIds.some((id) =>
      ['stats_overview', 'my_attendance', 'team_attendance'].includes(id),
    );
    const needsLeaves = widgetIds.some((id) =>
      ['stats_overview', 'my_leaves', 'pending_approvals', 'team_leaves'].includes(id),
    );

    // Fetch shared data ONCE
    const today = new Date().toISOString().split('T')[0];
    const [employeesResult, attendanceResult, leavesResult] = await Promise.all([
      needsEmployees
        ? this.employeeService.findAll(companyId, { page: 1, limit: 1000 }).catch(() => null)
        : Promise.resolve(null),
      needsAttendance
        ? this.attendanceService.findAll(companyId, { startDate: today, endDate: today, page: 1, limit: 1000 }).catch(() => null)
        : Promise.resolve(null),
      needsLeaves
        ? this.leaveService.findAll(companyId, { page: 1, limit: 500 }).catch(() => null)
        : Promise.resolve(null),
    ]);

    const employees = employeesResult?.data || [];
    const attendanceRecords = attendanceResult?.data || [];
    const leaveRecords = leavesResult?.data || [];

    // ── stats_overview ────────────────────────────────────────────────────
    if (widgetIds.includes('stats_overview')) {
      try {
        const activeEmployees = employees.filter((e: any) => e.isActive !== false);
        const presentToday = attendanceRecords.filter(
          (a: any) => a.status === 'PRESENT' || a.status === 'HALF_DAY',
        ).length;
        const wfhToday = attendanceRecords.filter((a: any) => a.isWorkFromHome).length;
        const absentToday = activeEmployees.length - presentToday;
        const pendingLeaves = leaveRecords.filter(
          (l: any) => l.status === 'PENDING',
        ).length;
        const draftPayrolls = 0; // Would require payroll query

        result.statsOverview = {
          totalEmployees: employees.length,
          activeEmployees: activeEmployees.length,
          presentToday,
          absentToday: Math.max(0, absentToday),
          wfhToday,
          pendingLeaves,
          draftPayrolls,
        };
      } catch {
        result.statsOverview = undefined;
      }
    }

    // ── my_attendance ─────────────────────────────────────────────────────
    if (widgetIds.includes('my_attendance')) {
      try {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const myAttResult = await this.attendanceService.findAll(companyId, {
          startDate: weekStart.toISOString().split('T')[0],
          endDate: today,
          page: 1,
          limit: 7,
        });
        result.myAttendance = (myAttResult?.data || []).map((a: any) => ({
          id: a.id,
          status: a.status,
          checkInTime: a.checkInTime ?? undefined,
          checkOutTime: a.checkOutTime ?? undefined,
          workHours: a.totalHours ?? a.workHours ?? undefined,
          isWorkFromHome: a.isWorkFromHome ?? undefined,
        }));
      } catch {
        result.myAttendance = [];
      }
    }

    // ── my_leaves ─────────────────────────────────────────────────────────
    if (widgetIds.includes('my_leaves')) {
      try {
        const myLeaves = leaveRecords.slice(0, 5);
        result.myLeaves = myLeaves.map((l: any) => ({
          id: l.id,
          leaveType: l.leaveType,
          status: l.status,
          totalDays: l.totalDays,
          startDate: typeof l.startDate === 'string' ? l.startDate : l.startDate?.toISOString?.()?.split('T')[0] || '',
          endDate: typeof l.endDate === 'string' ? l.endDate : l.endDate?.toISOString?.()?.split('T')[0] || '',
        }));
      } catch {
        result.myLeaves = [];
      }
    }

    // ── my_payslip ────────────────────────────────────────────────────────
    if (widgetIds.includes('my_payslip')) {
      try {
        // Find employee record for current user
        const myEmployee = employees.find((e: any) => e.workEmail === user.email);
        if (myEmployee) {
          const payslip = await this.payrollService.getMyLatest(companyId, myEmployee.id);
          if (payslip) {
            result.myPayslip = {
              payPeriodMonth: (payslip as any).payPeriodMonth ?? 0,
              payPeriodYear: (payslip as any).payPeriodYear ?? 0,
              netSalary: (payslip as any).netSalary ?? 0,
              status: (payslip as any).status ?? 'UNKNOWN',
            };
          }
        }
      } catch {
        result.myPayslip = undefined;
      }
    }

    // ── pending_approvals ─────────────────────────────────────────────────
    if (widgetIds.includes('pending_approvals')) {
      try {
        const pending = leaveRecords
          .filter((l: any) => l.status === 'PENDING')
          .slice(0, 10);
        result.pendingApprovals = pending.map((l: any) => ({
          id: l.id,
          leaveType: l.leaveType,
          status: l.status,
          totalDays: l.totalDays,
          startDate: typeof l.startDate === 'string' ? l.startDate : l.startDate?.toISOString?.()?.split('T')[0] || '',
          endDate: typeof l.endDate === 'string' ? l.endDate : l.endDate?.toISOString?.()?.split('T')[0] || '',
          employee: l.employee ? { firstName: l.employee.firstName, lastName: l.employee.lastName } : undefined,
        }));
      } catch {
        result.pendingApprovals = [];
      }
    }

    // ── team_attendance ───────────────────────────────────────────────────
    if (widgetIds.includes('team_attendance')) {
      try {
        const present = attendanceRecords.filter(
          (a: any) => a.status === 'PRESENT' || a.status === 'HALF_DAY',
        ).length;
        const wfh = attendanceRecords.filter((a: any) => a.isWorkFromHome).length;
        const onLeave = leaveRecords.filter((l: any) => l.status === 'APPROVED').length;
        const total = employees.length;

        result.teamAttendance = {
          present,
          absent: Math.max(0, total - present - onLeave),
          wfh,
          onLeave,
          total,
        };
      } catch {
        result.teamAttendance = undefined;
      }
    }

    // ── team_leaves ───────────────────────────────────────────────────────
    if (widgetIds.includes('team_leaves')) {
      try {
        const approvedLeaves = leaveRecords
          .filter((l: any) => l.status === 'APPROVED')
          .slice(0, 10);
        result.teamLeaves = approvedLeaves.map((l: any) => ({
          id: l.id,
          leaveType: l.leaveType,
          status: l.status,
          totalDays: l.totalDays,
          startDate: typeof l.startDate === 'string' ? l.startDate : l.startDate?.toISOString?.()?.split('T')[0] || '',
          endDate: typeof l.endDate === 'string' ? l.endDate : l.endDate?.toISOString?.()?.split('T')[0] || '',
          employee: l.employee ? { firstName: l.employee.firstName, lastName: l.employee.lastName } : undefined,
        }));
      } catch {
        result.teamLeaves = [];
      }
    }

    // ── Non-shared data: fetch conditionally ──────────────────────────────

    // Announcements
    if (widgetIds.includes('announcements')) {
      try {
        const announcementsResult = await this.socialService.findAnnouncements(companyId, 1, 5);
        result.announcements = (announcementsResult?.data || []).map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content ?? undefined,
          priority: a.priority ?? undefined,
          createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : undefined,
        }));
      } catch {
        result.announcements = [];
      }
    }

    // Kudos feed
    if (widgetIds.includes('kudos_feed')) {
      try {
        const kudosResult = await this.socialService.getKudos(companyId, 1, 5);
        result.kudos = (kudosResult?.data || []).map((k: any) => ({
          id: k.id,
          message: k.message ?? undefined,
          sender: k.sender ? { firstName: k.sender.firstName, lastName: k.sender.lastName } : undefined,
          recipient: k.recipient ? { firstName: k.recipient.firstName, lastName: k.recipient.lastName } : undefined,
        }));
      } catch {
        result.kudos = [];
      }
    }

    // Birthdays
    if (widgetIds.includes('birthdays')) {
      try {
        const birthdayList = await this.socialService.getBirthdays(companyId);
        result.birthdays = (birthdayList || []).map((b: any) => ({
          id: b.id,
          firstName: b.firstName,
          lastName: b.lastName,
          dateOfBirth: b.dateOfBirth ? new Date(b.dateOfBirth).toISOString().split('T')[0] : undefined,
        }));
      } catch {
        result.birthdays = [];
      }
    }

    // HR Analytics
    if (widgetIds.includes('hr_analytics')) {
      try {
        const overview = await this.analyticsService.getOverview(companyId);
        result.analyticsOverview = {
          totalEmployees: overview.totalEmployees,
          attritionRate: overview.attritionRate ?? undefined,
          openPositions: overview.openPositions,
        };
      } catch {
        result.analyticsOverview = undefined;
      }
    }

    // Recruitment pipeline
    if (widgetIds.includes('recruitment_pipeline')) {
      try {
        const jobsResult = await this.recruitmentService.getJobPostings(companyId, {
          page: 1,
          limit: 10,
          status: 'OPEN',
        });
        result.recruitmentPipeline = (jobsResult?.data || []).map((j: any) => ({
          id: j.id,
          title: j.title,
          department: j.department?.name ?? j.departmentName ?? undefined,
          applicantCount: j._count?.applicants ?? j.applicantCount ?? 0,
        }));
      } catch {
        result.recruitmentPipeline = [];
      }
    }

    // Activity feed
    if (widgetIds.includes('activity_feed')) {
      try {
        const auditResult = await this.auditService.findAll(companyId, { take: 10 });
        result.activityFeed = (auditResult?.data || []).map((a: any) => ({
          id: a.id,
          action: a.action,
          resourceType: a.resourceType ?? undefined,
          createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : undefined,
          user: a.user ? { firstName: a.user.firstName ?? a.userEmail ?? '', lastName: a.user.lastName ?? '' } : undefined,
        }));
      } catch {
        result.activityFeed = [];
      }
    }

    return result;
  }
}
