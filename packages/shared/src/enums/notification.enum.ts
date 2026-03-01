/**
 * Notification Types
 */
export enum NotificationType {
  // Leave
  LEAVE_APPLIED = 'LEAVE_APPLIED',
  LEAVE_APPROVED = 'LEAVE_APPROVED',
  LEAVE_REJECTED = 'LEAVE_REJECTED',
  LEAVE_CANCELLED = 'LEAVE_CANCELLED',

  // Attendance
  ATTENDANCE_MARKED = 'ATTENDANCE_MARKED',
  ATTENDANCE_REGULARIZED = 'ATTENDANCE_REGULARIZED',

  // Payroll
  PAYROLL_PROCESSED = 'PAYROLL_PROCESSED',
  PAYROLL_PAID = 'PAYROLL_PAID',
  PAYROLL_BATCH_COMPLETED = 'PAYROLL_BATCH_COMPLETED',
  PAYROLL_BONUS = 'PAYROLL_BONUS',
  PAYROLL_APPROVAL_PENDING = 'PAYROLL_APPROVAL_PENDING',
  PAYROLL_APPROVAL_APPROVED = 'PAYROLL_APPROVAL_APPROVED',
  PAYROLL_APPROVAL_REJECTED = 'PAYROLL_APPROVAL_REJECTED',
  PAYROLL_AUTO_GENERATED = 'PAYROLL_AUTO_GENERATED',
  PAYROLL_CHANGES_REQUESTED = 'PAYROLL_CHANGES_REQUESTED',

  // Invitation
  INVITATION_RECEIVED = 'INVITATION_RECEIVED',
  INVITATION_ACCEPTED = 'INVITATION_ACCEPTED',

  // Document
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_SHARED = 'DOCUMENT_SHARED',

  // Performance
  REVIEW_CYCLE_STARTED = 'REVIEW_CYCLE_STARTED',
  SELF_REVIEW_DUE = 'SELF_REVIEW_DUE',
  MANAGER_REVIEW_DUE = 'MANAGER_REVIEW_DUE',
  REVIEW_COMPLETED = 'REVIEW_COMPLETED',

  // Recruitment
  APPLICATION_RECEIVED = 'APPLICATION_RECEIVED',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',

  // Training
  TRAINING_ENROLLED = 'TRAINING_ENROLLED',
  TRAINING_COMPLETED = 'TRAINING_COMPLETED',

  // Asset
  ASSET_ASSIGNED = 'ASSET_ASSIGNED',
  ASSET_RETURN_REQUESTED = 'ASSET_RETURN_REQUESTED',

  // Expense
  EXPENSE_SUBMITTED = 'EXPENSE_SUBMITTED',
  EXPENSE_APPROVED = 'EXPENSE_APPROVED',
  EXPENSE_REJECTED = 'EXPENSE_REJECTED',
  EXPENSE_REIMBURSED = 'EXPENSE_REIMBURSED',

  // Shift
  SHIFT_ASSIGNED = 'SHIFT_ASSIGNED',
  SHIFT_CHANGED = 'SHIFT_CHANGED',

  // Policy
  POLICY_PUBLISHED = 'POLICY_PUBLISHED',
  POLICY_ACKNOWLEDGMENT_REQUIRED = 'POLICY_ACKNOWLEDGMENT_REQUIRED',

  // System
  SYSTEM = 'SYSTEM',
  WELCOME = 'WELCOME',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',

  // Offboarding
  OFFBOARDING_STARTED = 'OFFBOARDING_STARTED',
  OFFBOARDING_TASK_ASSIGNED = 'OFFBOARDING_TASK_ASSIGNED',
  OFFBOARDING_COMPLETED = 'OFFBOARDING_COMPLETED',

  // Delegation
  DELEGATION_ACTIVATED = 'DELEGATION_ACTIVATED',
  DELEGATION_EXPIRED = 'DELEGATION_EXPIRED',

  // Survey
  SURVEY_ASSIGNED = 'SURVEY_ASSIGNED',
  SURVEY_REMINDER = 'SURVEY_REMINDER',
  SURVEY_CLOSED = 'SURVEY_CLOSED',

  // Social
  KUDOS_RECEIVED = 'KUDOS_RECEIVED',
  ANNOUNCEMENT_PUBLISHED = 'ANNOUNCEMENT_PUBLISHED',

  // Timesheet
  TIMESHEET_SUBMITTED = 'TIMESHEET_SUBMITTED',
  TIMESHEET_APPROVED = 'TIMESHEET_APPROVED',
  TIMESHEET_REJECTED = 'TIMESHEET_REJECTED',

  // Contractor
  CONTRACTOR_INVOICE_SUBMITTED = 'CONTRACTOR_INVOICE_SUBMITTED',
  CONTRACTOR_INVOICE_APPROVED = 'CONTRACTOR_INVOICE_APPROVED',

  // Leave Balance
  LEAVE_BALANCE_LOW = 'LEAVE_BALANCE_LOW',
}

/**
 * Invitation Status
 */
export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

/**
 * Document Category
 */
export enum DocumentCategory {
  OFFER_LETTER = 'OFFER_LETTER',
  CONTRACT = 'CONTRACT',
  ID_PROOF = 'ID_PROOF',
  CERTIFICATE = 'CERTIFICATE',
  POLICY = 'POLICY',
  PAYSLIP = 'PAYSLIP',
  TAX_DOCUMENT = 'TAX_DOCUMENT',
  OTHER = 'OTHER',
}

/**
 * Workflow Entity Types
 */
export enum WorkflowEntityType {
  LEAVE = 'LEAVE',
  EXPENSE = 'EXPENSE',
  DOCUMENT = 'DOCUMENT',
  PAYROLL = 'PAYROLL',
}

/**
 * Workflow Status
 */
export enum WorkflowStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

/**
 * Workflow Step Status
 */
export enum WorkflowStepStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SKIPPED = 'SKIPPED',
}

/**
 * Workflow Approver Type
 */
export enum WorkflowApproverType {
  ROLE = 'ROLE',
  USER = 'USER',
  MANAGER = 'MANAGER',
}

/**
 * Custom Field Types
 */
export enum CustomFieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  SELECT = 'SELECT',
  MULTI_SELECT = 'MULTI_SELECT',
  BOOLEAN = 'BOOLEAN',
  URL = 'URL',
  EMAIL = 'EMAIL',
}

/**
 * Custom Field Entity Types (which entities can have custom fields)
 */
export enum CustomFieldEntityType {
  EMPLOYEE = 'EMPLOYEE',
  DEPARTMENT = 'DEPARTMENT',
  LEAVE = 'LEAVE',
  ATTENDANCE = 'ATTENDANCE',
}

/**
 * Webhook Delivery Status
 */
export enum WebhookDeliveryStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

/**
 * SSO Provider Types
 */
export enum SSOProvider {
  GOOGLE = 'google',
  SAML = 'saml',
}

/**
 * Webhook Event Types (subscribable events for webhook endpoints)
 */
export enum WebhookEvent {
  // Employee
  EMPLOYEE_CREATED = 'employee.created',
  EMPLOYEE_UPDATED = 'employee.updated',
  EMPLOYEE_DELETED = 'employee.deleted',

  // Leave
  LEAVE_APPLIED = 'leave.applied',
  LEAVE_APPROVED = 'leave.approved',
  LEAVE_REJECTED = 'leave.rejected',
  LEAVE_CANCELLED = 'leave.cancelled',

  // Attendance
  ATTENDANCE_MARKED = 'attendance.marked',

  // Payroll
  PAYROLL_PROCESSED = 'payroll.processed',

  // Invitation
  INVITATION_SENT = 'invitation.sent',
  INVITATION_ACCEPTED = 'invitation.accepted',

  // Document
  DOCUMENT_UPLOADED = 'document.uploaded',

  // User
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
}

/**
 * Import/Export Status
 */
export enum ImportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

/**
 * Export Format Types
 */
export enum ExportFormat {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  PDF = 'PDF',
}

/**
 * Review Cycle Types
 */
export enum ReviewCycleType {
  QUARTERLY = 'QUARTERLY',
  HALF_YEARLY = 'HALF_YEARLY',
  ANNUAL = 'ANNUAL',
  CUSTOM = 'CUSTOM',
}

/**
 * Review Cycle Status
 */
export enum ReviewCycleStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Performance Review Status
 */
export enum PerformanceReviewStatus {
  PENDING = 'PENDING',
  SELF_REVIEW = 'SELF_REVIEW',
  MANAGER_REVIEW = 'MANAGER_REVIEW',
  COMPLETED = 'COMPLETED',
}

/**
 * Goal Status
 */
export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Goal Priority
 */
export enum GoalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Job Posting Status
 */
export enum JobPostingStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
  FILLED = 'FILLED',
}

/**
 * Job Type
 */
export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
  REMOTE = 'REMOTE',
}

/**
 * Applicant Pipeline Stage
 */
export enum ApplicantStage {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEW = 'INTERVIEW',
  ASSESSMENT = 'ASSESSMENT',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

/**
 * Interview Status
 */
export enum InterviewStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

/**
 * Interview Recommendation
 */
export enum InterviewRecommendation {
  STRONG_HIRE = 'STRONG_HIRE',
  HIRE = 'HIRE',
  NO_HIRE = 'NO_HIRE',
  STRONG_NO_HIRE = 'STRONG_NO_HIRE',
}

/**
 * Training Course Status
 */
export enum TrainingCourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Training Enrollment Status
 */
export enum TrainingEnrollmentStatus {
  ENROLLED = 'ENROLLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
  FAILED = 'FAILED',
}

/**
 * Asset Status
 */
export enum AssetStatus {
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  RETIRED = 'RETIRED',
  DISPOSED = 'DISPOSED',
}

/**
 * Asset Condition
 */
export enum AssetCondition {
  NEW = 'NEW',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  DAMAGED = 'DAMAGED',
  DISPOSED = 'DISPOSED',
}

/**
 * Asset Category
 */
export enum AssetCategory {
  LAPTOP = 'LAPTOP',
  PHONE = 'PHONE',
  MONITOR = 'MONITOR',
  DESK = 'DESK',
  CHAIR = 'CHAIR',
  VEHICLE = 'VEHICLE',
  SOFTWARE_LICENSE = 'SOFTWARE_LICENSE',
  OTHER = 'OTHER',
}

/**
 * Expense Claim Status
 */
export enum ExpenseClaimStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REIMBURSED = 'REIMBURSED',
  CANCELLED = 'CANCELLED',
}

/**
 * Expense Category
 */
export enum ExpenseCategory {
  TRAVEL = 'TRAVEL',
  FOOD = 'FOOD',
  ACCOMMODATION = 'ACCOMMODATION',
  EQUIPMENT = 'EQUIPMENT',
  COMMUNICATION = 'COMMUNICATION',
  TRAINING = 'TRAINING',
  OTHER = 'OTHER',
}

/**
 * Policy Status
 */
export enum PolicyStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Policy Category
 */
export enum PolicyCategory {
  HR = 'HR',
  IT = 'IT',
  FINANCE = 'FINANCE',
  COMPLIANCE = 'COMPLIANCE',
  SAFETY = 'SAFETY',
  GENERAL = 'GENERAL',
}

/**
 * Training Category
 */
export enum TrainingCategory {
  TECHNICAL = 'TECHNICAL',
  COMPLIANCE = 'COMPLIANCE',
  SOFT_SKILLS = 'SOFT_SKILLS',
  ONBOARDING = 'ONBOARDING',
  LEADERSHIP = 'LEADERSHIP',
}

// ─── Phase 6: Competitive Feature Pack Enums ───

/**
 * Separation Type (reason for offboarding)
 */
export enum SeparationType {
  RESIGNATION = 'RESIGNATION',
  TERMINATION = 'TERMINATION',
  RETIREMENT = 'RETIREMENT',
  CONTRACT_END = 'CONTRACT_END',
  LAYOFF = 'LAYOFF',
}

/**
 * Offboarding Process Status
 */
export enum OffboardingStatus {
  INITIATED = 'INITIATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Offboarding Task Status
 */
export enum OffboardingTaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  BLOCKED = 'BLOCKED',
}

/**
 * Leave Accrual Type
 */
export enum LeaveAccrualType {
  ANNUAL_GRANT = 'ANNUAL_GRANT',
  MONTHLY_ACCRUAL = 'MONTHLY_ACCRUAL',
  NO_ACCRUAL = 'NO_ACCRUAL',
}

/**
 * Leave Transaction Type (ledger entries)
 */
export enum LeaveTransactionType {
  ACCRUAL = 'ACCRUAL',
  USAGE = 'USAGE',
  CARRYOVER = 'CARRYOVER',
  ADJUSTMENT = 'ADJUSTMENT',
  EXPIRY = 'EXPIRY',
  GRANT = 'GRANT',
}

/**
 * Survey Type
 */
export enum SurveyType {
  PULSE = 'PULSE',
  ENGAGEMENT = 'ENGAGEMENT',
  EXIT = 'EXIT',
  CUSTOM = 'CUSTOM',
}

/**
 * Survey Status
 */
export enum SurveyStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Survey Question Type
 */
export enum SurveyQuestionType {
  RATING = 'RATING',
  TEXT = 'TEXT',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  NPS = 'NPS',
}

/**
 * Kudos Category
 */
export enum KudosCategory {
  TEAMWORK = 'TEAMWORK',
  INNOVATION = 'INNOVATION',
  LEADERSHIP = 'LEADERSHIP',
  ABOVE_AND_BEYOND = 'ABOVE_AND_BEYOND',
  CUSTOMER_FOCUS = 'CUSTOMER_FOCUS',
}

/**
 * Announcement Priority
 */
export enum AnnouncementPriority {
  NORMAL = 'NORMAL',
  IMPORTANT = 'IMPORTANT',
  URGENT = 'URGENT',
}

/**
 * Timesheet Status
 */
export enum TimesheetStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * Time Entry Type
 */
export enum TimeEntryType {
  REGULAR = 'REGULAR',
  OVERTIME = 'OVERTIME',
  BILLABLE = 'BILLABLE',
  NON_BILLABLE = 'NON_BILLABLE',
}

/**
 * Contractor Status
 */
export enum ContractorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TERMINATED = 'TERMINATED',
}

/**
 * Contract Type
 */
export enum ContractType {
  FIXED_PRICE = 'FIXED_PRICE',
  HOURLY = 'HOURLY',
  MILESTONE = 'MILESTONE',
}

/**
 * Contractor Invoice Payment Status
 */
export enum InvoicePaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
}
