/**
 * API Types
 * All TypeScript interfaces for API responses and request payloads.
 * Extracted from api-client.ts for better code organization.
 */

// ==================== Core Types ====================

export interface Department {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  parent?: { id: string; name: string; code: string } | null;
  children?: Department[];
  headEmployee?: { id: string; firstName: string; lastName: string; employeeCode: string } | null;
  costCenter?: string;
  isActive: boolean;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentData {
  name: string;
  code?: string;
  description?: string;
  parentId?: string;
  headEmployeeId?: string;
  costCenter?: string;
  isActive?: boolean;
}

export interface DepartmentFilters {
  search?: string;
  isActive?: boolean;
  parentId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'code' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface DepartmentPaginationResponse {
  data: Department[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ==================== Designation Types ====================

export interface Designation {
  id: string;
  companyId: string;
  title: string;
  code: string;
  description?: string;
  level: number;
  minSalary?: number;
  maxSalary?: number;
  currency: string;
  isActive: boolean;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDesignationData {
  title: string;
  code?: string;
  description?: string;
  level?: number;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
}

export interface DesignationFilters {
  search?: string;
  level?: number;
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'code' | 'level' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface DesignationPaginationResponse {
  data: Designation[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ==================== Attendance Types ====================

export interface Attendance {
  id: string;
  companyId: string;
  employeeId: string;
  attendanceDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  totalHours?: number;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HALF_DAY' | 'WEEKEND' | 'HOLIDAY';
  isWorkFromHome?: boolean;
  notes?: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttendanceData {
  employeeId: string;
  attendanceDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  status?: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HALF_DAY' | 'WEEKEND' | 'HOLIDAY';
  isWorkFromHome?: boolean;
  notes?: string;
}

export interface AttendanceFilters {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HALF_DAY' | 'WEEKEND' | 'HOLIDAY';
  page?: number;
  limit?: number;
}

export interface AttendancePaginationResponse {
  data: Attendance[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ==================== Leave Types ====================

export interface Leave {
  id: string;
  companyId: string;
  employeeId: string;
  leaveType: 'CASUAL' | 'SICK' | 'EARNED' | 'PRIVILEGE' | 'MATERNITY' | 'PATERNITY' | 'COMPENSATORY' | 'LOSS_OF_PAY';
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
  halfDayType?: 'FIRST_HALF' | 'SECOND_HALF';
  reason: string;
  contactDuringLeave?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  appliedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeaveData {
  employeeId: string;
  leaveType: 'CASUAL' | 'SICK' | 'EARNED' | 'PRIVILEGE' | 'MATERNITY' | 'PATERNITY' | 'COMPENSATORY' | 'LOSS_OF_PAY';
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay?: boolean;
  halfDayType?: 'FIRST_HALF' | 'SECOND_HALF';
  reason: string;
  contactDuringLeave?: string;
}

export interface LeaveFilters {
  employeeId?: string;
  leaveType?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface LeavePaginationResponse {
  data: Leave[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ==================== Payroll Types ====================

export interface Payroll {
  id: string;
  companyId: string;
  employeeId: string;
  payPeriodMonth: number;
  payPeriodYear: number;
  payDate?: string;
  basicSalary: number;
  hra?: number;
  specialAllowance?: number;
  otherAllowances?: number;
  grossSalary: number;
  netSalary: number;
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  esiEmployer: number;
  tds: number;
  pt: number;
  otherDeductions: number;
  daysWorked: number;
  daysInMonth: number;
  leaveDays: number;
  absentDays: number;
  overtimeHours: number;
  bankAccount?: string;
  ifscCode?: string;
  bankName?: string;
  status: 'DRAFT' | 'PROCESSED' | 'PAID' | 'HOLD';
  approvalStatus?: string;
  adjustments?: Array<{ id: string; name: string; type: 'EARNING' | 'DEDUCTION'; amount: number; reason?: string }>;
  batchId?: string;
  paidAt?: string;
  payslipPath?: string;
  notes?: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePayrollData {
  employeeId: string;
  payPeriodMonth: number;
  payPeriodYear: number;
  payDate?: string;
  basicSalary: number;
  hra?: number;
  specialAllowance?: number;
  otherAllowances?: number;
  pfEmployee?: number;
  pfEmployer?: number;
  esiEmployee?: number;
  esiEmployer?: number;
  tds?: number;
  pt?: number;
  otherDeductions?: number;
  daysWorked: number;
  daysInMonth: number;
  leaveDays?: number;
  absentDays?: number;
  overtimeHours?: number;
  bankAccount?: string;
  ifscCode?: string;
  bankName?: string;
  notes?: string;
}

export interface PayrollFilters {
  employeeId?: string;
  status?: 'DRAFT' | 'PROCESSED' | 'PAID' | 'HOLD';
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
  skip?: number;
  take?: number;
}

export interface PayrollPaginationResponse {
  data: Payroll[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ==================== Payroll Extended Types (Overhaul) ====================

export interface SalaryComponent {
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  calculationType: 'FIXED' | 'PERCENTAGE_OF_BASIC' | 'PERCENTAGE_OF_GROSS';
  value: number;
  isTaxable: boolean;
}

export interface SalaryStructure {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  country: string;
  components: SalaryComponent[];
  designationId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalaryStructureData {
  name: string;
  description?: string;
  country: string;
  components: SalaryComponent[];
  designationId?: string;
}

export interface UpdateSalaryStructureData {
  name?: string;
  description?: string;
  country?: string;
  components?: SalaryComponent[];
  designationId?: string;
  isActive?: boolean;
}

export interface SalaryStructurePaginationResponse {
  data: SalaryStructure[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface PayrollBatch {
  id: string;
  companyId: string;
  month: number;
  year: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  totalCount: number;
  processedCount: number;
  failedCount: number;
  errors?: Array<{ employeeId: string; error: string }>;
  initiatedBy?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollYTD {
  id: string;
  companyId: string;
  employeeId: string;
  fiscalYear: number;
  grossEarnings: number;
  totalDeductions: number;
  taxPaid: number;
  pfEmployeeYtd?: number;
  pfEmployerYtd?: number;
  esiEmployeeYtd?: number;
  esiEmployerYtd?: number;
  tdsYtd?: number;
  ptYtd?: number;
  ssEmployeeYtd?: number;
  ssEmployerYtd?: number;
  medicareYtd?: number;
  federalTaxYtd?: number;
  stateTaxYtd?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationAnomaly {
  employeeId: string;
  employeeName: string;
  type: 'MISSING' | 'NEW' | 'SALARY_CHANGE' | 'DEDUCTION_CHANGE';
  currentGross?: number;
  previousGross?: number;
  changePercent?: number;
  details: string;
}

export interface ReconciliationReport {
  month: number;
  year: number;
  currentBatchTotal: number;
  previousBatchTotal: number;
  variance: number;
  variancePercent: number;
  headcountChange: number;
  anomalies: ReconciliationAnomaly[];
}

export interface PayrollCompanySettings {
  payrollCountry?: string;
  payFrequency?: string;
  pfEnabled?: boolean;
  esiEnabled?: boolean;
  emailPayslipEnabled?: boolean;
  companyPan?: string;
  gstin?: string;
  tan?: string;
  pfRegNo?: string;
  esiRegNo?: string;
  ein?: string;
}

// ==================== User & Company Types ====================

export interface CompanyUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'HR_ADMIN' | 'MANAGER' | 'EMPLOYEE';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  companyName: string;
  companyCode: string;
  industry?: string;
  website?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  gstin?: string;
  pan?: string;
  payrollCountry?: string;
  payFrequency?: string;
  pfEnabled?: boolean;
  esiEnabled?: boolean;
  emailPayslipEnabled?: boolean;
  tan?: string;
  pfRegNo?: string;
  esiRegNo?: string;
  ein?: string;
  subscriptionTier: string;
  subscriptionStatus: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCompanyData {
  companyName?: string;
  industry?: string;
  website?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  gstin?: string;
  pan?: string;
  payrollCountry?: string;
  payFrequency?: string;
  pfEnabled?: boolean;
  esiEnabled?: boolean;
  emailPayslipEnabled?: boolean;
  tan?: string;
  pfRegNo?: string;
  esiRegNo?: string;
  ein?: string;
}

// ==================== Audit Log Types ====================

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  companyId: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  skip?: number;
  take?: number;
}

export interface AuditLogPaginationResponse {
  data: AuditLog[];
  total: number;
  skip: number;
  take: number;
}

// ==================== Notification Types ====================

export interface Notification {
  id: string;
  companyId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  resourceType?: string;
  resourceId?: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationPaginationResponse {
  data: Notification[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ==================== Invitation Types ====================

export interface Invitation {
  id: string;
  companyId: string;
  email: string;
  role: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  invitedBy: string;
  inviterName?: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationData {
  email: string;
  role: string;
}

export interface AcceptInvitationData {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
}

export interface InvitationVerifyResponse {
  id: string;
  email: string;
  role: string;
  companyName: string;
  inviterName: string;
  expiresAt: string;
}

export interface InvitationFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InvitationPaginationResponse {
  data: Invitation[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ==================== Document Types ====================

export interface Document {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  category: string;
  employeeId?: string;
  uploadedBy: string;
  isActive: boolean;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  };
  uploader?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentData {
  name: string;
  description?: string;
  category: string;
  employeeId?: string;
}

export interface DocumentFilters {
  category?: string;
  employeeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface DocumentPaginationResponse {
  data: Document[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ==================== API Key Types ====================

export interface ApiKey {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  prefix: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: string;
  lastUsedAt?: string;
  isActive: boolean;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyCreateResponse extends ApiKey {
  key: string;
}

export interface CreateApiKeyData {
  name: string;
  description?: string;
  permissions: string[];
  expiresAt?: string;
}

export interface ApiKeyPaginationResponse {
  data: ApiKey[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ==================== Webhook Types ====================

export interface WebhookEndpoint {
  id: string;
  companyId: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  headers: Record<string, string>;
  maxRetries: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhookData {
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  maxRetries?: number;
}

export interface UpdateWebhookData {
  name?: string;
  url?: string;
  events?: string[];
  headers?: Record<string, string>;
  maxRetries?: number;
  isActive?: boolean;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventType: string;
  payload: any;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING';
  statusCode?: number;
  response?: string;
  attempt: number;
  maxRetries: number;
  nextRetryAt?: string;
  deliveredAt?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryPaginationResponse {
  data: WebhookDelivery[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ==================== Custom Field Types ====================

export interface CustomFieldDefinition {
  id: string;
  companyId: string;
  name: string;
  fieldKey: string;
  description?: string;
  entityType: string;
  fieldType: string;
  options?: { value: string; label: string }[];
  isRequired: boolean;
  defaultValue?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomFieldDefinitionData {
  name: string;
  fieldKey: string;
  description?: string;
  entityType: string;
  fieldType: string;
  options?: { value: string; label: string }[];
  isRequired?: boolean;
  defaultValue?: string;
  displayOrder?: number;
}

export interface CustomFieldValue {
  id: string;
  definitionId: string;
  entityId: string;
  value?: string;
  definition?: CustomFieldDefinition;
  createdAt: string;
  updatedAt: string;
}

// ==================== Import/Export Types ====================

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

// ==================== SSO Types ====================

export interface SSOConfig {
  provider?: 'google' | 'saml';
  enabled: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  samlEntryPoint?: string;
  samlIssuer?: string;
  samlCert?: string;
  allowedDomains?: string[];
}

export interface UpdateSSOConfigData {
  provider?: 'google' | 'saml';
  enabled?: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  allowedDomains?: string[];
}

// ==================== Performance Management Types ====================

export interface ReviewCycle {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  cycleType: string;
  startDate: string;
  endDate: string;
  selfReviewDeadline?: string;
  managerReviewDeadline?: string;
  ratingScale?: any;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewCycleData {
  name: string;
  description?: string;
  cycleType: string;
  startDate: string;
  endDate: string;
  selfReviewDeadline?: string;
  managerReviewDeadline?: string;
  ratingScale?: any;
}

export interface PerformanceReview {
  id: string;
  companyId: string;
  cycleId: string;
  employeeId: string;
  reviewerId?: string;
  selfRating?: number;
  selfComments?: string;
  managerRating?: number;
  managerComments?: string;
  finalRating?: number;
  overallComments?: string;
  status: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  goals?: Goal[];
}

export interface Goal {
  id: string;
  companyId: string;
  employeeId: string;
  title: string;
  description?: string;
  category?: string;
  priority: string;
  startDate?: string;
  dueDate?: string;
  progress: number;
  weightage: number;
  keyResults?: any;
  reviewId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalData {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  startDate?: string;
  dueDate?: string;
  weightage?: number;
  keyResults?: any;
  reviewId?: string;
}

// ==================== Recruitment Types ====================

export interface JobPosting {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  jobType: string;
  experience?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  showSalary: boolean;
  departmentId?: string;
  designationId?: string;
  hiringManagerId?: string;
  openings: number;
  filled: number;
  publishedAt?: string;
  closingDate?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobPostingData {
  title: string;
  description: string;
  requirements?: string;
  location?: string;
  jobType?: string;
  experience?: string;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  showSalary?: boolean;
  departmentId?: string;
  designationId?: string;
  hiringManagerId?: string;
  openings?: number;
  closingDate?: string;
}

export interface Applicant {
  id: string;
  companyId: string;
  jobPostingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumePath?: string;
  coverLetter?: string;
  source?: string;
  stage: string;
  stageNotes?: string;
  rating?: number;
  offerSalary?: number;
  offerDate?: string;
  joinDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicantData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  coverLetter?: string;
  source?: string;
}

export interface Interview {
  id: string;
  companyId: string;
  applicantId: string;
  scheduledAt: string;
  duration: number;
  location?: string;
  interviewType: string;
  round: number;
  interviewerId?: string;
  feedback?: string;
  rating?: number;
  recommendation?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Training Types ====================

export interface TrainingCourse {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  category?: string;
  instructor?: string;
  contentUrl?: string;
  duration?: number;
  startDate?: string;
  endDate?: string;
  maxEnrollments?: number;
  isMandatory: boolean;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { enrollments: number };
}

export interface CreateTrainingCourseData {
  title: string;
  description?: string;
  category?: string;
  instructor?: string;
  contentUrl?: string;
  duration?: number;
  startDate?: string;
  endDate?: string;
  maxEnrollments?: number;
  isMandatory?: boolean;
}

export interface TrainingEnrollment {
  id: string;
  companyId: string;
  courseId: string;
  employeeId: string;
  progress: number;
  completedAt?: string;
  score?: number;
  passed?: boolean;
  certificateUrl?: string;
  status: string;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Asset Types ====================

export interface Asset {
  id: string;
  companyId: string;
  name: string;
  assetCode: string;
  description?: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  assignedTo?: string;
  assignedAt?: string;
  condition: string;
  location?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetData {
  name: string;
  assetCode: string;
  description?: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  condition?: string;
  location?: string;
}

export interface AssetAssignment {
  id: string;
  assetId: string;
  employeeId: string;
  assignedAt: string;
  returnedAt?: string;
  assignmentNotes?: string;
  returnNotes?: string;
  conditionOnReturn?: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Expense Types ====================

export interface ExpenseClaim {
  id: string;
  companyId: string;
  employeeId: string;
  title: string;
  description?: string;
  category: string;
  amount: number;
  currency: string;
  receiptPath?: string;
  expenseDate: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;
  reimbursedAt?: string;
  reimbursedAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseClaimData {
  title: string;
  description?: string;
  category: string;
  amount: number;
  currency?: string;
  expenseDate: string;
}

// ==================== Shift Types ====================

export interface ShiftDefinition {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  isOvernight: boolean;
  graceMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftDefinitionData {
  name: string;
  code: string;
  description?: string;
  color?: string;
  startTime: string;
  endTime: string;
  breakDuration?: number;
  isOvernight?: boolean;
  graceMinutes?: number;
}

export interface ShiftAssignment {
  id: string;
  companyId: string;
  shiftId: string;
  employeeId: string;
  assignmentDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  shift?: ShiftDefinition;
}

// ==================== Policy Types ====================

export interface Policy {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  version: string;
  filePath?: string;
  publishedAt?: string;
  effectiveDate?: string;
  requiresAcknowledgment: boolean;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { acknowledgments: number };
}

export interface CreatePolicyData {
  title: string;
  description?: string;
  content: string;
  category: string;
  version?: string;
  effectiveDate?: string;
  requiresAcknowledgment?: boolean;
}

export interface PolicyAcknowledgment {
  id: string;
  policyId: string;
  employeeId: string;
  acknowledgedAt: string;
  createdAt: string;
}
