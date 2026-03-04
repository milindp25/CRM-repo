import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

// ─── Leave Balance Page ───────────────────────────────────────

@ObjectType()
export class LeaveBalanceEmployee {
  @Field() id: string;
  @Field({ nullable: true }) employeeCode?: string;
  @Field() firstName: string;
  @Field() lastName: string;
  @Field({ nullable: true }) departmentName?: string;
}

@ObjectType()
export class LeaveBalanceRecord {
  @Field() id: string;
  @Field() employeeId: string;
  @Field() leaveType: string;
  @Field() status: string;
  @Field(() => Float) totalDays: number;
  @Field() startDate: string;
  @Field() endDate: string;
}

@ObjectType()
export class LeaveBalancePageData {
  @Field(() => [LeaveBalanceEmployee]) employees: LeaveBalanceEmployee[];
  @Field(() => [LeaveBalanceRecord]) leaves: LeaveBalanceRecord[];
}

// ─── Directory Page ───────────────────────────────────────────

@ObjectType()
export class DirectoryEmployee {
  @Field() id: string;
  @Field() firstName: string;
  @Field() lastName: string;
  @Field({ nullable: true }) workEmail?: string;
  @Field({ nullable: true }) workPhone?: string;
  @Field({ nullable: true }) department?: string;
  @Field({ nullable: true }) designation?: string;
  @Field({ nullable: true }) dateOfJoining?: string;
  @Field({ nullable: true }) dateOfBirth?: string;
  @Field({ nullable: true }) profilePhotoUrl?: string;
}

@ObjectType()
export class DirectoryPageData {
  @Field(() => [DirectoryEmployee]) employees: DirectoryEmployee[];
  @Field(() => [DirectoryEmployee]) birthdays: DirectoryEmployee[];
  @Field(() => [DirectoryEmployee]) anniversaries: DirectoryEmployee[];
}

// ─── Payroll Page ─────────────────────────────────────────────

@ObjectType()
export class PayrollEmployee {
  @Field() id: string;
  @Field({ nullable: true }) employeeCode?: string;
  @Field() firstName: string;
  @Field() lastName: string;
}

@ObjectType()
export class PayrollBatchRecord {
  @Field() id: string;
  @Field(() => Int) month: number;
  @Field(() => Int) year: number;
  @Field() status: string;
  @Field(() => Int, { nullable: true }) totalCount?: number;
  @Field(() => Int, { nullable: true }) processedCount?: number;
  @Field(() => Int, { nullable: true }) failedCount?: number;
}

@ObjectType()
export class PayrollRecord {
  @Field() id: string;
  @Field({ nullable: true }) employeeId?: string;
  @Field(() => PayrollEmployee, { nullable: true }) employee?: PayrollEmployee;
  @Field(() => Float) grossSalary: number;
  @Field(() => Float) netSalary: number;
  @Field() status: string;
  @Field({ nullable: true }) approvalStatus?: string;
}

@ObjectType()
export class PayrollPageData {
  @Field(() => [PayrollEmployee]) employees: PayrollEmployee[];
  @Field(() => [PayrollBatchRecord]) batches: PayrollBatchRecord[];
  @Field(() => [PayrollRecord]) records: PayrollRecord[];
}

// ─── Social Page ──────────────────────────────────────────────

@ObjectType()
export class SocialAnnouncement {
  @Field() id: string;
  @Field() title: string;
  @Field({ nullable: true }) content?: string;
  @Field({ nullable: true }) priority?: string;
  @Field({ nullable: true }) isPinned?: boolean;
  @Field({ nullable: true }) createdAt?: string;
}

@ObjectType()
export class SocialKudos {
  @Field() id: string;
  @Field({ nullable: true }) message?: string;
  @Field({ nullable: true }) category?: string;
  @Field({ nullable: true }) senderName?: string;
  @Field({ nullable: true }) recipientName?: string;
  @Field({ nullable: true }) createdAt?: string;
}

@ObjectType()
export class SocialPageData {
  @Field(() => [SocialAnnouncement]) announcements: SocialAnnouncement[];
  @Field(() => [SocialKudos]) kudos: SocialKudos[];
  @Field(() => [PayrollEmployee]) employees: PayrollEmployee[];
}

// ─── Shift Page ───────────────────────────────────────────────

@ObjectType()
export class ShiftDefinitionRecord {
  @Field() id: string;
  @Field() name: string;
  @Field({ nullable: true }) code?: string;
  @Field() startTime: string;
  @Field() endTime: string;
  @Field(() => Int, { nullable: true }) breakDuration?: number;
  @Field({ nullable: true }) isActive?: boolean;
  @Field({ nullable: true }) isOvernight?: boolean;
}

@ObjectType()
export class ShiftAssignmentRecord {
  @Field() id: string;
  @Field() employeeId: string;
  @Field() shiftId: string;
  @Field({ nullable: true }) assignmentDate?: string;
  @Field({ nullable: true }) endDate?: string;
  @Field(() => ShiftDefinitionRecord, { nullable: true }) shift?: ShiftDefinitionRecord;
}

@ObjectType()
export class ShiftPageData {
  @Field(() => [ShiftDefinitionRecord]) definitions: ShiftDefinitionRecord[];
  @Field(() => [ShiftAssignmentRecord]) assignments: ShiftAssignmentRecord[];
  @Field(() => [ShiftAssignmentRecord]) myAssignments: ShiftAssignmentRecord[];
}
