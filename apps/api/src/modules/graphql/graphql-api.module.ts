import { Module } from '@nestjs/common';
import { EmployeeModule } from '../employee/employee.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { LeaveModule } from '../leave/leave.module';
import { PayrollModule } from '../payroll/payroll.module';
import { SocialModule } from '../social/social.module';
import { AuditModule } from '../audit/audit.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { RecruitmentModule } from '../recruitment/recruitment.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { ShiftModule } from '../shift/shift.module';
import { DashboardResolver } from './dashboard.resolver';
import { LeaveBalanceResolver } from './leave-balance.resolver';
import { DirectoryResolver } from './directory.resolver';
import { PayrollPageResolver } from './payroll-page.resolver';
import { SocialPageResolver } from './social-page.resolver';
import { ShiftPageResolver } from './shift-page.resolver';

@Module({
  imports: [
    EmployeeModule,
    AttendanceModule,
    LeaveModule,
    PayrollModule,
    SocialModule,
    AuditModule,
    AnalyticsModule,
    RecruitmentModule,
    DashboardModule,
    ShiftModule,
  ],
  providers: [
    DashboardResolver,
    LeaveBalanceResolver,
    DirectoryResolver,
    PayrollPageResolver,
    SocialPageResolver,
    ShiftPageResolver,
  ],
})
export class GraphqlApiModule {}
