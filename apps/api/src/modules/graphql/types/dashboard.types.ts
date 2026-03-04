import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class EmployeeSummary {
  @Field() firstName: string;
  @Field() lastName: string;
}

@ObjectType()
export class DepartmentSummary {
  @Field() name: string;
}

@ObjectType()
export class StatsOverviewData {
  @Field(() => Int) totalEmployees: number;
  @Field(() => Int) activeEmployees: number;
  @Field(() => Int) presentToday: number;
  @Field(() => Int) absentToday: number;
  @Field(() => Int) wfhToday: number;
  @Field(() => Int) pendingLeaves: number;
  @Field(() => Int) draftPayrolls: number;
}

@ObjectType()
export class AttendanceRecord {
  @Field() id: string;
  @Field() status: string;
  @Field(() => String, { nullable: true }) checkInTime?: string;
  @Field(() => String, { nullable: true }) checkOutTime?: string;
  @Field(() => Float, { nullable: true }) workHours?: number;
  @Field({ nullable: true }) isWorkFromHome?: boolean;
}

@ObjectType()
export class LeaveRecord {
  @Field() id: string;
  @Field() leaveType: string;
  @Field() status: string;
  @Field(() => Float) totalDays: number;
  @Field() startDate: string;
  @Field() endDate: string;
  @Field(() => EmployeeSummary, { nullable: true }) employee?: EmployeeSummary;
}

@ObjectType()
export class PayslipRecord {
  @Field(() => Int) payPeriodMonth: number;
  @Field(() => Int) payPeriodYear: number;
  @Field(() => Float) netSalary: number;
  @Field() status: string;
}

@ObjectType()
export class TeamAttendanceData {
  @Field(() => Int) present: number;
  @Field(() => Int) absent: number;
  @Field(() => Int) wfh: number;
  @Field(() => Int) onLeave: number;
  @Field(() => Int) total: number;
}

@ObjectType()
export class AnnouncementRecord {
  @Field() id: string;
  @Field() title: string;
  @Field({ nullable: true }) content?: string;
  @Field({ nullable: true }) priority?: string;
  @Field({ nullable: true }) createdAt?: string;
}

@ObjectType()
export class KudosRecord {
  @Field() id: string;
  @Field({ nullable: true }) message?: string;
  @Field(() => EmployeeSummary, { nullable: true }) sender?: EmployeeSummary;
  @Field(() => EmployeeSummary, { nullable: true }) recipient?: EmployeeSummary;
}

@ObjectType()
export class BirthdayRecord {
  @Field() id: string;
  @Field() firstName: string;
  @Field() lastName: string;
  @Field({ nullable: true }) dateOfBirth?: string;
}

@ObjectType()
export class AnalyticsOverviewData {
  @Field(() => Int) totalEmployees: number;
  @Field(() => Float, { nullable: true }) attritionRate?: number;
  @Field(() => Int) openPositions: number;
}

@ObjectType()
export class JobPostingRecord {
  @Field() id: string;
  @Field() title: string;
  @Field({ nullable: true }) department?: string;
  @Field(() => Int, { nullable: true }) applicantCount?: number;
}

@ObjectType()
export class AuditLogRecord {
  @Field() id: string;
  @Field() action: string;
  @Field({ nullable: true }) resourceType?: string;
  @Field({ nullable: true }) createdAt?: string;
  @Field(() => EmployeeSummary, { nullable: true }) user?: EmployeeSummary;
}

@ObjectType()
export class DashboardData {
  @Field(() => StatsOverviewData, { nullable: true }) statsOverview?: StatsOverviewData;
  @Field(() => [AttendanceRecord], { nullable: true }) myAttendance?: AttendanceRecord[];
  @Field(() => [LeaveRecord], { nullable: true }) myLeaves?: LeaveRecord[];
  @Field(() => PayslipRecord, { nullable: true }) myPayslip?: PayslipRecord;
  @Field(() => [LeaveRecord], { nullable: true }) pendingApprovals?: LeaveRecord[];
  @Field(() => TeamAttendanceData, { nullable: true }) teamAttendance?: TeamAttendanceData;
  @Field(() => [LeaveRecord], { nullable: true }) teamLeaves?: LeaveRecord[];
  @Field(() => [AnnouncementRecord], { nullable: true }) announcements?: AnnouncementRecord[];
  @Field(() => [KudosRecord], { nullable: true }) kudos?: KudosRecord[];
  @Field(() => [BirthdayRecord], { nullable: true }) birthdays?: BirthdayRecord[];
  @Field(() => AnalyticsOverviewData, { nullable: true }) analyticsOverview?: AnalyticsOverviewData;
  @Field(() => [JobPostingRecord], { nullable: true }) recruitmentPipeline?: JobPostingRecord[];
  @Field(() => [AuditLogRecord], { nullable: true }) activityFeed?: AuditLogRecord[];
}
