/**
 * Application Event Constants and Payload Interfaces
 *
 * Used with @nestjs/event-emitter for internal event-driven communication
 * between modules (e.g., leave module emits events, notification module listens).
 */

// ============================================================================
// Event Name Constants
// ============================================================================

export const LEAVE_APPLIED = 'leave.applied';
export const LEAVE_APPROVED = 'leave.approved';
export const LEAVE_REJECTED = 'leave.rejected';
export const LEAVE_CANCELLED = 'leave.cancelled';

export const INVITATION_SENT = 'invitation.sent';
export const INVITATION_ACCEPTED = 'invitation.accepted';

export const DOCUMENT_UPLOADED = 'document.uploaded';

export const PAYROLL_PROCESSED = 'payroll.processed';
export const PAYROLL_APPROVAL_PENDING = 'payroll.approval.pending';
export const PAYROLL_APPROVAL_APPROVED = 'payroll.approval.approved';
export const PAYROLL_APPROVAL_REJECTED = 'payroll.approval.rejected';
export const PAYROLL_CHANGES_REQUESTED = 'payroll.changes.requested';
export const PAYROLL_AUTO_GENERATED = 'payroll.auto.generated';
export const PAYROLL_PAID = 'payroll.paid';

export const USER_REGISTERED = 'user.registered';

export const ATTENDANCE_MARKED = 'attendance.marked';

// Employee events
export const EMPLOYEE_CREATED = 'employee.created';
export const EMPLOYEE_UPDATED = 'employee.updated';
export const EMPLOYEE_DELETED = 'employee.deleted';

// User events
export const USER_CREATED = 'user.created';
export const USER_UPDATED = 'user.updated';

// SSO events
export const USER_SSO_LOGIN = 'user.sso_login';
export const USER_SSO_REGISTERED = 'user.sso_registered';

// Webhook delivery event
export const WEBHOOK_DELIVER = 'webhook.deliver';

// ============================================================================
// Event Payload Interfaces
// ============================================================================

export interface LeaveAppliedEvent {
  companyId: string;
  leaveId: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  /** User IDs of managers/HR who should be notified */
  approverIds: string[];
}

export interface LeaveApprovedEvent {
  companyId: string;
  leaveId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  approverName?: string;
}

export interface LeaveRejectedEvent {
  companyId: string;
  leaveId: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  rejectionReason?: string;
  approverName?: string;
}

export interface LeaveCancelledEvent {
  companyId: string;
  leaveId: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
}

export interface InvitationSentEvent {
  companyId: string;
  companyName: string;
  inviteeEmail: string;
  inviteeName?: string;
  inviterName: string;
  inviterId: string;
  role: string;
  invitationUrl: string;
}

export interface InvitationAcceptedEvent {
  companyId: string;
  userId: string;
  userName: string;
  inviterId: string;
}

export interface DocumentUploadedEvent {
  companyId: string;
  documentId: string;
  documentName: string;
  uploadedByUserId: string;
  uploadedByName: string;
  /** User IDs who should be notified about the document */
  targetUserIds: string[];
}

export interface PayrollProcessedEvent {
  companyId: string;
  payrollId: string;
  periodStart: string;
  periodEnd: string;
  processedByName: string;
  /** Employee user IDs who were part of this payroll run */
  employeeUserIds: string[];
}

export interface UserRegisteredEvent {
  companyId: string;
  companyName: string;
  userId: string;
  userName: string;
  userEmail: string;
  loginUrl?: string;
  tempPassword?: string;
}

export interface AttendanceMarkedEvent {
  companyId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
}

export interface EmployeeCreatedEvent {
  companyId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentId?: string;
  designationId?: string;
}

export interface EmployeeUpdatedEvent {
  companyId: string;
  employeeId: string;
  employeeName: string;
  changes: Record<string, any>;
}

export interface EmployeeDeletedEvent {
  companyId: string;
  employeeId: string;
  employeeName: string;
}

export interface WebhookDeliverEvent {
  companyId: string;
  eventType: string;
  payload: Record<string, any>;
}

export interface PayrollApprovalEvent {
  companyId: string;
  batchId: string;
  month: number;
  year: number;
  approvedBy?: string;
  rejectedBy?: string;
  requestedBy?: string;
  employeeUserIds?: string[];
  comments?: string;
  reason?: string;
  count?: number;
  paidBy?: string;
}

export interface PayrollAutoGeneratedEvent {
  companyId: string;
  batchId: string;
  month: number;
  year: number;
  count: number;
}
