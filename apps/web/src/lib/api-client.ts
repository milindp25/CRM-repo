/**
 * API Client for NestJS Backend
 * Handles all HTTP requests to the standalone API server
 */

import type { UserProfile } from '@hrplatform/shared';
import { setToken, setRefreshToken, getToken, clearTokens as clearAllTokens } from './token-sync';
import type {
  Department, CreateDepartmentData, DepartmentFilters, DepartmentPaginationResponse,
  Designation, CreateDesignationData, DesignationFilters, DesignationPaginationResponse,
  Attendance, CreateAttendanceData, AttendanceFilters, AttendancePaginationResponse,
  Leave, CreateLeaveData, LeaveFilters, LeavePaginationResponse,
  Payroll, CreatePayrollData, PayrollFilters, PayrollPaginationResponse,
  CompanyUser, Company, UpdateCompanyData,
  AuditLog, AuditLogFilters, AuditLogPaginationResponse,
  Notification, NotificationPaginationResponse,
  Invitation, CreateInvitationData, AcceptInvitationData, InvitationVerifyResponse,
  InvitationFilters, InvitationPaginationResponse,
  Document, CreateDocumentData, DocumentFilters, DocumentPaginationResponse,
  ApiKey, ApiKeyCreateResponse, CreateApiKeyData, ApiKeyPaginationResponse,
  WebhookEndpoint, CreateWebhookData, UpdateWebhookData, WebhookDeliveryPaginationResponse,
  CustomFieldDefinition, CreateCustomFieldDefinitionData, CustomFieldValue,
  ImportResult, SSOConfig, UpdateSSOConfigData,
  ReviewCycle, CreateReviewCycleData, PerformanceReview, Goal, CreateGoalData,
  JobPosting, CreateJobPostingData, Applicant, CreateApplicantData, Interview,
  TrainingCourse, CreateTrainingCourseData, TrainingEnrollment,
  Asset, CreateAssetData, AssetAssignment,
  ExpenseClaim, CreateExpenseClaimData,
  ShiftDefinition, CreateShiftDefinitionData, ShiftAssignment,
  Policy, CreatePolicyData, PolicyAcknowledgment,
  SalaryStructure, CreateSalaryStructureData, UpdateSalaryStructureData, SalaryStructurePaginationResponse,
  PayrollBatch, PayrollYTD, ReconciliationReport, PayrollCompanySettings,
} from './api/types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

// Response Types
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    statusCode: number;
    message: string | string[];
    timestamp: string;
    path?: string;
  };
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// Auth Types
export interface AuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}

// Employee Types
export interface Employee {
  id: string;
  companyId: string;
  employeeCode: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  workEmail: string;
  workPhone?: string;
  personalEmail?: string;
  personalPhone?: string;
  aadhaar?: string;
  pan?: string;
  passport?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  dateOfJoining: string;
  dateOfLeaving?: string;
  probationEndDate?: string;
  departmentId?: string;
  designationId?: string;
  reportingManagerId?: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  status: 'ACTIVE' | 'ON_NOTICE' | 'RESIGNED' | 'TERMINATED' | 'ON_LEAVE';
  isActive: boolean;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  designation?: {
    id: string;
    title: string;
    level: number;
  };
  reportingManager?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    workEmail: string;
  };
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeData {
  employeeCode?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  workEmail: string;
  workPhone?: string;
  personalEmail?: string;
  personalPhone?: string;
  aadhaar?: string;
  pan?: string;
  passport?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  dateOfJoining: string;
  dateOfLeaving?: string;
  probationEndDate?: string;
  departmentId?: string;
  designationId?: string;
  reportingManagerId?: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  status?: 'ACTIVE' | 'ON_NOTICE' | 'RESIGNED' | 'TERMINATED' | 'ON_LEAVE';
}

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  designationId?: string;
  status?: 'ACTIVE' | 'ON_NOTICE' | 'RESIGNED' | 'TERMINATED' | 'ON_LEAVE';
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
  reportingManagerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'firstName' | 'employeeCode' | 'dateOfJoining';
  sortOrder?: 'asc' | 'desc';
}

export interface EmployeePaginationResponse {
  data: Employee[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// API Client Error
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errors?: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request Options
interface RequestOptions extends RequestInit {
  token?: string;
  skipAuth?: boolean;
}

/**
 * API Client Class
 * Singleton pattern for HTTP requests
 * Uses httpOnly cookies for secure auth + Bearer header fallback
 */
class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshPromise: Promise<AuthResponse> | null = null;

  constructor() {
    this.baseUrl = API_BASE_URL;

    // Load token from storage on initialization (client-side only)
    if (typeof window !== 'undefined') {
      this.accessToken = getToken();
    }
  }

  /**
   * Store access token (uses token-sync utility)
   */
  private storeToken(token: string, remember: boolean = true): void {
    setToken(token, remember);
    this.accessToken = token;
  }

  /**
   * Store refresh token (uses token-sync utility)
   */
  private storeRefreshToken(token: string, remember: boolean = true): void {
    setRefreshToken(token, remember);
  }

  /**
   * Clear all stored tokens (uses token-sync utility)
   */
  clearTokens(): void {
    clearAllTokens();
    this.accessToken = null;
  }

  /**
   * Set access token manually
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Attempt to refresh the access token.
   * Deduplicates concurrent refresh attempts using a shared promise.
   */
  private async attemptRefresh(): Promise<AuthResponse> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const refreshToken = typeof window !== 'undefined'
          ? localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token')
          : null;

        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(refreshToken ? { refreshToken } : {}),
        });

        const data: ApiResponse<AuthResponse> = await response.json();

        if (!response.ok || !data.success) {
          throw new ApiError(401, 'Token refresh failed');
        }

        const result = (data as ApiSuccessResponse<AuthResponse>).data;
        const remember = typeof window !== 'undefined' ? !!localStorage.getItem('refresh_token') : true;
        this.storeToken(result.accessToken, remember);
        this.storeRefreshToken(result.refreshToken, remember);
        return result;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Make HTTP request to API
   * Automatically retries once on 401 by refreshing the access token.
   */
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {},
    _isRetry: boolean = false,
  ): Promise<T> {
    const { token, skipAuth, ...fetchOptions } = options;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    };

    // Add authorization header (Bearer token as fallback alongside httpOnly cookie)
    const authToken = token || this.accessToken;
    if (authToken && !skipAuth) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Build full URL
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        credentials: 'include', // Send httpOnly cookies
      });

      // Parse response
      const data: ApiResponse<T> = await response.json();

      // Auto-refresh on 401 (token expired)
      if (response.status === 401 && !skipAuth && !_isRetry) {
        try {
          await this.attemptRefresh();
          return this.request<T>(endpoint, options, true);
        } catch {
          // Refresh failed - throw original 401
        }
      }

      // Handle error responses
      if (!response.ok || !data.success) {
        const errorData = data as ApiErrorResponse;
        const message = Array.isArray(errorData.error.message)
          ? errorData.error.message.join(', ')
          : errorData.error.message;

        throw new ApiError(
          errorData.error.statusCode,
          message,
          Array.isArray(errorData.error.message) ? errorData.error.message : [message],
        );
      }

      // Return data
      const successData = data as ApiSuccessResponse<T>;
      return successData.data;
    } catch (error) {
      // Re-throw ApiError
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or parsing errors
      if (error instanceof Error) {
        throw new ApiError(0, `Network error: ${error.message}`);
      }

      throw new ApiError(0, 'Unknown error occurred');
    }
  }

  // ==================== Auth Endpoints ====================

  /**
   * Login user
   */
  async login(credentials: LoginCredentials, remember: boolean = true): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });

    // Store tokens
    this.storeToken(response.accessToken, remember);
    this.storeRefreshToken(response.refreshToken, remember);

    return response;
  }

  /**
   * Register new user
   */
  async register(data: RegisterData, remember: boolean = true): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });

    // Store tokens
    this.storeToken(response.accessToken, remember);
    this.storeRefreshToken(response.refreshToken, remember);

    return response;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      // Always clear tokens, even if request fails
      this.clearTokens();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<AuthResponse> {
    return this.attemptRefresh();
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me');
  }

  /**
   * Request a password reset email
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    });
  }

  /**
   * Reset password using token from email
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
      skipAuth: true,
    });
  }

  // ==================== Health Endpoints ====================

  /**
   * Check API health
   */
  async healthCheck(): Promise<any> {
    return this.request('/health', { skipAuth: true });
  }

  /**
   * Simple ping
   */
  async ping(): Promise<{ message: string; timestamp: string; uptime: number }> {
    return this.request('/health/ping', { skipAuth: true });
  }

  // ==================== Employee Endpoints ====================

  /**
   * Get all employees with optional filters
   */
  async getEmployees(filters?: EmployeeFilters): Promise<EmployeePaginationResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/employees?${queryString}` : '/employees';

    return this.request<EmployeePaginationResponse>(endpoint);
  }

  /**
   * Get employee by ID
   */
  async getEmployee(id: string): Promise<Employee> {
    return this.request<Employee>(`/employees/${id}`);
  }

  /**
   * Create new employee
   */
  async createEmployee(data: CreateEmployeeData): Promise<Employee> {
    return this.request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update employee
   */
  async updateEmployee(id: string, data: Partial<CreateEmployeeData>): Promise<Employee> {
    return this.request<Employee>(`/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete employee (soft delete)
   */
  async deleteEmployee(id: string): Promise<void> {
    return this.request<void>(`/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Department Endpoints ====================

  async getDepartments(filters?: DepartmentFilters): Promise<DepartmentPaginationResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return this.request<DepartmentPaginationResponse>(`/departments?${params}`);
  }

  async getDepartment(id: string): Promise<Department> {
    return this.request<Department>(`/departments/${id}`);
  }

  async createDepartment(data: CreateDepartmentData): Promise<Department> {
    return this.request<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDepartment(id: string, data: Partial<CreateDepartmentData>): Promise<Department> {
    return this.request<Department>(`/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDepartment(id: string): Promise<void> {
    return this.request<void>(`/departments/${id}`, {
      method: 'DELETE',
    });
  }

  async getDepartmentHierarchy(): Promise<Department[]> {
    return this.request<Department[]>('/departments/hierarchy');
  }

  // ==================== Designation Endpoints ====================

  async getDesignations(filters?: DesignationFilters): Promise<DesignationPaginationResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return this.request<DesignationPaginationResponse>(`/designations?${params}`);
  }

  async getDesignation(id: string): Promise<Designation> {
    return this.request<Designation>(`/designations/${id}`);
  }

  async createDesignation(data: CreateDesignationData): Promise<Designation> {
    return this.request<Designation>('/designations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDesignation(id: string, data: Partial<CreateDesignationData>): Promise<Designation> {
    return this.request<Designation>(`/designations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDesignation(id: string): Promise<void> {
    return this.request<void>(`/designations/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Attendance Endpoints ====================

  async getAttendance(filters?: AttendanceFilters): Promise<AttendancePaginationResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return this.request<AttendancePaginationResponse>(`/attendance?${params}`);
  }

  async getAttendanceById(id: string): Promise<Attendance> {
    return this.request<Attendance>(`/attendance/${id}`);
  }

  async createAttendance(data: CreateAttendanceData): Promise<Attendance> {
    return this.request<Attendance>('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAttendance(id: string, data: Partial<CreateAttendanceData>): Promise<Attendance> {
    return this.request<Attendance>(`/attendance/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAttendance(id: string): Promise<void> {
    return this.request<void>(`/attendance/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Leave Endpoints ====================

  async getLeave(filters?: LeaveFilters): Promise<LeavePaginationResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return this.request<LeavePaginationResponse>(`/leave?${params}`);
  }

  async getLeaveById(id: string): Promise<Leave> {
    return this.request<Leave>(`/leave/${id}`);
  }

  async createLeave(data: CreateLeaveData): Promise<Leave> {
    return this.request<Leave>('/leave', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLeave(id: string, data: Partial<CreateLeaveData>): Promise<Leave> {
    return this.request<Leave>(`/leave/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteLeave(id: string): Promise<void> {
    return this.request<void>(`/leave/${id}`, {
      method: 'DELETE',
    });
  }

  async approveLeave(id: string, approvalNotes?: string): Promise<Leave> {
    return this.request<Leave>(`/leave/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approvalNotes }),
    });
  }

  async rejectLeave(id: string, approvalNotes?: string): Promise<Leave> {
    return this.request<Leave>(`/leave/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ approvalNotes }),
    });
  }

  async cancelLeave(id: string, cancellationReason?: string): Promise<Leave> {
    return this.request<Leave>(`/leave/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ cancellationReason }),
    });
  }

  async bulkApproveLeave(leaveIds: string[], reason?: string): Promise<{ processed: number; skipped: number; errors: Array<{ leaveId: string; reason: string }> }> {
    return this.request(`/leave/bulk-approve`, {
      method: 'POST',
      body: JSON.stringify({ leaveIds, reason }),
    });
  }

  async bulkRejectLeave(leaveIds: string[], reason?: string): Promise<{ processed: number; skipped: number; errors: Array<{ leaveId: string; reason: string }> }> {
    return this.request(`/leave/bulk-reject`, {
      method: 'POST',
      body: JSON.stringify({ leaveIds, reason }),
    });
  }

  // ==================== Bulk Attendance ====================

  async bulkMarkAttendance(date: string, records: Array<{ employeeId: string; status?: string; checkInTime?: string; checkOutTime?: string }>): Promise<{ created: number; skipped: number; errors: Array<{ employeeId: string; reason: string }> }> {
    return this.request(`/attendance/bulk`, {
      method: 'POST',
      body: JSON.stringify({ date, records }),
    });
  }

  // ==================== Payroll Endpoints ====================

  async getPayroll(filters?: PayrollFilters): Promise<PayrollPaginationResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    return this.request<PayrollPaginationResponse>(`/payroll?${params}`);
  }

  async getPayrollById(id: string): Promise<Payroll> {
    return this.request<Payroll>(`/payroll/${id}`);
  }

  async createPayroll(data: CreatePayrollData): Promise<Payroll> {
    return this.request<Payroll>('/payroll', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePayroll(id: string, data: Partial<CreatePayrollData>): Promise<Payroll> {
    return this.request<Payroll>(`/payroll/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePayroll(id: string): Promise<void> {
    return this.request<void>(`/payroll/${id}`, {
      method: 'DELETE',
    });
  }

  async processPayroll(id: string, notes?: string): Promise<Payroll> {
    return this.request<Payroll>(`/payroll/${id}/process`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async markPayrollAsPaid(id: string, paidAt?: string, notes?: string): Promise<Payroll> {
    return this.request<Payroll>(`/payroll/${id}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify({ paidAt, notes }),
    });
  }

  // ==================== Payroll Extended Endpoints ====================

  // Salary Structure CRUD
  async getSalaryStructures(filters?: { designationId?: string; isActive?: string; skip?: number; take?: number }): Promise<SalaryStructurePaginationResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return this.request<SalaryStructurePaginationResponse>(
      queryString ? `/payroll/salary-structures?${queryString}` : '/payroll/salary-structures',
    );
  }

  async getSalaryStructure(id: string): Promise<SalaryStructure> {
    return this.request<SalaryStructure>(`/payroll/salary-structures/${id}`);
  }

  async createSalaryStructure(data: CreateSalaryStructureData): Promise<SalaryStructure> {
    return this.request<SalaryStructure>('/payroll/salary-structures', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSalaryStructure(id: string, data: UpdateSalaryStructureData): Promise<SalaryStructure> {
    return this.request<SalaryStructure>(`/payroll/salary-structures/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSalaryStructure(id: string): Promise<void> {
    return this.request<void>(`/payroll/salary-structures/${id}`, {
      method: 'DELETE',
    });
  }

  // Batch Payroll
  async batchProcessPayroll(month: number, year: number): Promise<PayrollBatch> {
    return this.request<PayrollBatch>('/payroll/batch', {
      method: 'POST',
      body: JSON.stringify({ month, year }),
    });
  }

  async getPayrollBatches(): Promise<PayrollBatch[]> {
    return this.request<PayrollBatch[]>('/payroll/batch/list');
  }

  async getPayrollBatch(id: string): Promise<PayrollBatch> {
    return this.request<PayrollBatch>(`/payroll/batch/${id}`);
  }

  // Bonus
  async processBonus(data: { employeeIds: string[]; bonusType: string; amount: number; month: number; year: number; notes?: string }): Promise<any> {
    return this.request('/payroll/bonus', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Recalculate
  async recalculatePayroll(id: string): Promise<any> {
    return this.request(`/payroll/${id}/recalculate`, {
      method: 'POST',
    });
  }

  // YTD
  async getPayrollYtd(employeeId: string, fiscalYear: number): Promise<PayrollYTD> {
    return this.request<PayrollYTD>(`/payroll/ytd/${employeeId}/${fiscalYear}`);
  }

  // Reconciliation
  async reconcilePayroll(month: number, year: number): Promise<ReconciliationReport> {
    return this.request<ReconciliationReport>(`/payroll/reconcile?month=${month}&year=${year}`);
  }

  // Approval
  async submitPayrollForApproval(batchId: string, notes?: string): Promise<any> {
    return this.request(`/payroll/batch/${batchId}/submit-approval`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async approvePayrollBatch(batchId: string): Promise<any> {
    return this.request(`/payroll/batch/${batchId}/approve`, {
      method: 'POST',
    });
  }

  async rejectPayrollBatch(batchId: string, notes: string): Promise<any> {
    return this.request(`/payroll/batch/${batchId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  async requestBatchChanges(batchId: string, comments: string): Promise<any> {
    return this.request(`/payroll/batch/${batchId}/request-changes`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });
  }

  async markBatchAsPaid(batchId: string): Promise<any> {
    return this.request(`/payroll/batch/${batchId}/mark-paid`, {
      method: 'POST',
    });
  }

  // Employee self-service
  async getMyLatestPaycheck(): Promise<any> {
    return this.request('/payroll/my/latest');
  }

  async getMyPaycheckHistory(): Promise<any> {
    return this.request('/payroll/my/history');
  }

  async getMyPayrollYtd(): Promise<any> {
    return this.request('/payroll/my/ytd');
  }

  // PDF Downloads (return Blob for file download)
  async downloadPayslipPdf(payrollId: string): Promise<Blob> {
    const url = `${this.baseUrl}/payroll/${payrollId}/payslip`;
    const authToken = this.accessToken;
    const response = await fetch(url, {
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to download payslip');
    }
    return response.blob();
  }

  async downloadForm16(employeeId: string, fiscalYear: number): Promise<Blob> {
    const url = `${this.baseUrl}/payroll/form16/${employeeId}/${fiscalYear}`;
    const authToken = this.accessToken;
    const response = await fetch(url, {
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to download Form 16');
    }
    return response.blob();
  }

  async downloadW2(employeeId: string, taxYear: number): Promise<Blob> {
    const url = `${this.baseUrl}/payroll/w2/${employeeId}/${taxYear}`;
    const authToken = this.accessToken;
    const response = await fetch(url, {
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to download W-2');
    }
    return response.blob();
  }

  async downloadBankFile(batchId: string): Promise<Blob> {
    const url = `${this.baseUrl}/payroll/batch/${batchId}/bank-file`;
    const authToken = this.accessToken;
    const response = await fetch(url, {
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      credentials: 'include',
    });
    if (!response.ok) {
      throw new ApiError(response.status, 'Failed to download bank file');
    }
    return response.blob();
  }

  // ==================== Profile Endpoints ====================

  async updateOwnProfile(data: { firstName?: string; lastName?: string; phone?: string }): Promise<any> {
    return this.request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.request('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // ==================== User Management Endpoints ====================

  async getUsers(): Promise<CompanyUser[]> {
    return this.request<CompanyUser[]>('/users');
  }

  async getUserById(id: string): Promise<CompanyUser> {
    return this.request<CompanyUser>(`/users/${id}`);
  }

  async updateUserRole(id: string, role: string): Promise<CompanyUser> {
    return this.request<CompanyUser>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async activateUser(id: string): Promise<CompanyUser> {
    return this.request<CompanyUser>(`/users/${id}/activate`, {
      method: 'PATCH',
    });
  }

  async deactivateUser(id: string): Promise<CompanyUser> {
    return this.request<CompanyUser>(`/users/${id}/deactivate`, {
      method: 'PATCH',
    });
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Company Endpoints ====================

  async getCompany(): Promise<Company> {
    return this.request<Company>('/company');
  }

  async updateCompany(data: UpdateCompanyData): Promise<Company> {
    return this.request<Company>('/company', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ==================== Audit Log Endpoints ====================

  async getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogPaginationResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return this.request<AuditLogPaginationResponse>(
      queryString ? `/audit-logs?${queryString}` : '/audit-logs',
    );
  }

  // ==================== Notification Endpoints ====================

  async getNotifications(filters?: { page?: number; limit?: number; unreadOnly?: boolean }): Promise<NotificationPaginationResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return this.request<NotificationPaginationResponse>(
      queryString ? `/notifications?${queryString}` : '/notifications',
    );
  }

  async getUnreadNotificationCount(): Promise<{ count: number }> {
    return this.request<{ count: number }>('/notifications/unread-count');
  }

  async markNotificationAsRead(id: string): Promise<void> {
    return this.request<void>(`/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsAsRead(): Promise<void> {
    return this.request<void>('/notifications/read-all', {
      method: 'PATCH',
    });
  }

  // ==================== Invitation Endpoints ====================

  async getInvitations(filters?: InvitationFilters): Promise<InvitationPaginationResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return this.request<InvitationPaginationResponse>(
      queryString ? `/invitations?${queryString}` : '/invitations',
    );
  }

  async getInvitation(id: string): Promise<Invitation> {
    return this.request<Invitation>(`/invitations/${id}`);
  }

  async createInvitation(data: CreateInvitationData): Promise<Invitation> {
    return this.request<Invitation>('/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async revokeInvitation(id: string): Promise<Invitation> {
    return this.request<Invitation>(`/invitations/${id}/revoke`, {
      method: 'PATCH',
    });
  }

  async resendInvitation(id: string): Promise<Invitation> {
    return this.request<Invitation>(`/invitations/${id}/resend`, {
      method: 'PATCH',
    });
  }

  async verifyInvitation(token: string): Promise<InvitationVerifyResponse> {
    return this.request<InvitationVerifyResponse>(`/invitations/verify/${token}`, {
      skipAuth: true,
    });
  }

  async acceptInvitation(data: AcceptInvitationData): Promise<{ message: string; user: { id: string; email: string; firstName: string; lastName: string } }> {
    return this.request(`/invitations/accept`, {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });
  }

  // ==================== Document Endpoints ====================

  async getDocuments(filters?: DocumentFilters): Promise<DocumentPaginationResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    return this.request<DocumentPaginationResponse>(
      queryString ? `/documents?${queryString}` : '/documents',
    );
  }

  async getDocument(id: string): Promise<Document> {
    return this.request<Document>(`/documents/${id}`);
  }

  async getEmployeeDocuments(employeeId: string): Promise<Document[]> {
    return this.request<Document[]>(`/documents/employee/${employeeId}`);
  }

  async uploadDocument(file: File, metadata: CreateDocumentData): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const authToken = this.accessToken;
    const url = `${this.baseUrl}/documents`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      credentials: 'include',
      body: formData,
    });

    const data: ApiResponse<Document> = await response.json();

    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      const message = Array.isArray(errorData.error.message)
        ? errorData.error.message.join(', ')
        : errorData.error.message;
      throw new ApiError(errorData.error.statusCode, message);
    }

    return (data as ApiSuccessResponse<Document>).data;
  }

  async updateDocument(id: string, data: Partial<CreateDocumentData>): Promise<Document> {
    return this.request<Document>(`/documents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteDocument(id: string): Promise<void> {
    return this.request<void>(`/documents/${id}`, {
      method: 'DELETE',
    });
  }

  getDocumentDownloadUrl(id: string): string {
    return `${this.baseUrl}/documents/${id}/download`;
  }

  // ==================== API Key Endpoints ====================

  async getApiKeys(page?: number, limit?: number): Promise<ApiKeyPaginationResponse> {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const queryString = params.toString();
    return this.request<ApiKeyPaginationResponse>(
      queryString ? `/api-keys?${queryString}` : '/api-keys',
    );
  }

  async getApiKey(id: string): Promise<ApiKey> {
    return this.request<ApiKey>(`/api-keys/${id}`);
  }

  async createApiKey(data: CreateApiKeyData): Promise<ApiKeyCreateResponse> {
    return this.request<ApiKeyCreateResponse>('/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async revokeApiKey(id: string): Promise<void> {
    return this.request<void>(`/api-keys/${id}/revoke`, {
      method: 'DELETE',
    });
  }

  async deleteApiKey(id: string): Promise<void> {
    return this.request<void>(`/api-keys/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Webhook Endpoints ====================

  async getWebhooks(): Promise<WebhookEndpoint[]> {
    return this.request<WebhookEndpoint[]>('/webhooks');
  }

  async getWebhook(id: string): Promise<WebhookEndpoint> {
    return this.request<WebhookEndpoint>(`/webhooks/${id}`);
  }

  async createWebhook(data: CreateWebhookData): Promise<WebhookEndpoint> {
    return this.request<WebhookEndpoint>('/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWebhook(id: string, data: UpdateWebhookData): Promise<WebhookEndpoint> {
    return this.request<WebhookEndpoint>(`/webhooks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(id: string): Promise<void> {
    return this.request<void>(`/webhooks/${id}`, {
      method: 'DELETE',
    });
  }

  async regenerateWebhookSecret(id: string): Promise<{ secret: string }> {
    return this.request<{ secret: string }>(`/webhooks/${id}/regenerate-secret`, {
      method: 'POST',
    });
  }

  async getWebhookDeliveries(id: string, page?: number, limit?: number): Promise<WebhookDeliveryPaginationResponse> {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (limit) params.append('limit', String(limit));
    const queryString = params.toString();
    return this.request<WebhookDeliveryPaginationResponse>(
      queryString ? `/webhooks/${id}/deliveries?${queryString}` : `/webhooks/${id}/deliveries`,
    );
  }

  async testWebhook(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/webhooks/${id}/test`, {
      method: 'POST',
    });
  }

  // ==================== Custom Field Endpoints ====================

  async getCustomFieldDefinitions(entityType?: string): Promise<CustomFieldDefinition[]> {
    const params = entityType ? `?entityType=${entityType}` : '';
    return this.request<CustomFieldDefinition[]>(`/custom-fields/definitions${params}`);
  }

  async getCustomFieldDefinition(id: string): Promise<CustomFieldDefinition> {
    return this.request<CustomFieldDefinition>(`/custom-fields/definitions/${id}`);
  }

  async createCustomFieldDefinition(data: CreateCustomFieldDefinitionData): Promise<CustomFieldDefinition> {
    return this.request<CustomFieldDefinition>('/custom-fields/definitions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomFieldDefinition(id: string, data: Partial<CreateCustomFieldDefinitionData>): Promise<CustomFieldDefinition> {
    return this.request<CustomFieldDefinition>(`/custom-fields/definitions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomFieldDefinition(id: string): Promise<void> {
    return this.request<void>(`/custom-fields/definitions/${id}`, {
      method: 'DELETE',
    });
  }

  async getCustomFieldValues(entityType: string, entityId: string): Promise<CustomFieldValue[]> {
    return this.request<CustomFieldValue[]>(`/custom-fields/values/${entityType}/${entityId}`);
  }

  async setCustomFieldValues(entityType: string, entityId: string, values: { fieldKey: string; value: any }[]): Promise<void> {
    return this.request<void>(`/custom-fields/values/${entityType}/${entityId}`, {
      method: 'PUT',
      body: JSON.stringify({ values }),
    });
  }

  // ==================== Import/Export Endpoints ====================

  async importEmployees(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const authToken = this.accessToken;
    const url = `${this.baseUrl}/import/employees`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      credentials: 'include',
      body: formData,
    });

    const data: ApiResponse<ImportResult> = await response.json();

    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      const message = Array.isArray(errorData.error.message)
        ? errorData.error.message.join(', ')
        : errorData.error.message;
      throw new ApiError(errorData.error.statusCode, message);
    }

    return (data as ApiSuccessResponse<ImportResult>).data;
  }

  getImportTemplateUrl(entityType: string): string {
    return `${this.baseUrl}/import/template/${entityType}`;
  }

  async downloadExport(entityType: string, filters?: Record<string, string>): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const queryString = params.toString();
    const endpoint = queryString ? `/export/${entityType}?${queryString}` : `/export/${entityType}`;
    const url = `${this.baseUrl}${endpoint}`;

    const authToken = this.accessToken;
    const response = await fetch(url, {
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'Export failed');
    }

    return response.blob();
  }

  // ==================== SSO Endpoints ====================

  async getSSOConfig(): Promise<SSOConfig> {
    return this.request<SSOConfig>('/auth/sso/config');
  }

  async updateSSOConfig(data: UpdateSSOConfigData): Promise<SSOConfig> {
    return this.request<SSOConfig>('/auth/sso/config', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  getGoogleSSOUrl(companyId: string): string {
    return `${this.baseUrl}/auth/google?companyId=${companyId}`;
  }

  // ==================== Performance Management Endpoints ====================

  async getReviewCycles(filters?: { status?: string; page?: number; limit?: number }): Promise<ReviewCycle[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    const query = params.toString();
    return this.request<ReviewCycle[]>(`/performance/review-cycles${query ? `?${query}` : ''}`);
  }

  async getReviewCycle(id: string): Promise<ReviewCycle> {
    return this.request<ReviewCycle>(`/performance/review-cycles/${id}`);
  }

  async createReviewCycle(data: CreateReviewCycleData): Promise<ReviewCycle> {
    return this.request<ReviewCycle>('/performance/review-cycles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReviewCycle(id: string, data: Partial<CreateReviewCycleData>): Promise<ReviewCycle> {
    return this.request<ReviewCycle>(`/performance/review-cycles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async activateReviewCycle(id: string): Promise<ReviewCycle> {
    return this.request<ReviewCycle>(`/performance/review-cycles/${id}/activate`, { method: 'PATCH' });
  }

  async completeReviewCycle(id: string): Promise<ReviewCycle> {
    return this.request<ReviewCycle>(`/performance/review-cycles/${id}/complete`, { method: 'PATCH' });
  }

  async getPerformanceReviews(filters?: { cycleId?: string; employeeId?: string }): Promise<PerformanceReview[]> {
    const params = new URLSearchParams();
    if (filters?.cycleId) params.append('cycleId', filters.cycleId);
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    const query = params.toString();
    return this.request<PerformanceReview[]>(`/performance/reviews${query ? `?${query}` : ''}`);
  }

  async getMyReviews(): Promise<PerformanceReview[]> {
    return this.request<PerformanceReview[]>('/performance/reviews/my');
  }

  async getPerformanceReview(id: string): Promise<PerformanceReview> {
    return this.request<PerformanceReview>(`/performance/reviews/${id}`);
  }

  async submitSelfReview(id: string, data: { selfRating: number; selfComments?: string }): Promise<PerformanceReview> {
    return this.request<PerformanceReview>(`/performance/reviews/${id}/self-review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async submitManagerReview(id: string, data: { managerRating: number; managerComments?: string; finalRating?: number; overallComments?: string }): Promise<PerformanceReview> {
    return this.request<PerformanceReview>(`/performance/reviews/${id}/manager-review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getGoals(filters?: { employeeId?: string; status?: string; reviewId?: string }): Promise<Goal[]> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.reviewId) params.append('reviewId', filters.reviewId);
    const query = params.toString();
    return this.request<Goal[]>(`/performance/goals${query ? `?${query}` : ''}`);
  }

  async getMyGoals(): Promise<Goal[]> {
    return this.request<Goal[]>('/performance/goals/my');
  }

  async getGoal(id: string): Promise<Goal> {
    return this.request<Goal>(`/performance/goals/${id}`);
  }

  async createGoal(data: CreateGoalData): Promise<Goal> {
    return this.request<Goal>('/performance/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGoal(id: string, data: Partial<CreateGoalData>): Promise<Goal> {
    return this.request<Goal>(`/performance/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateGoalProgress(id: string, progress: number): Promise<Goal> {
    return this.request<Goal>(`/performance/goals/${id}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ progress }),
    });
  }

  async deleteGoal(id: string): Promise<void> {
    await this.request<void>(`/performance/goals/${id}`, { method: 'DELETE' });
  }

  // ==================== Recruitment Endpoints ====================

  async getJobPostings(filters?: { status?: string; departmentId?: string }): Promise<JobPosting[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.departmentId) params.append('departmentId', filters.departmentId);
    const query = params.toString();
    return this.request<JobPosting[]>(`/recruitment/jobs${query ? `?${query}` : ''}`);
  }

  async getJobPosting(id: string): Promise<JobPosting> {
    return this.request<JobPosting>(`/recruitment/jobs/${id}`);
  }

  async createJobPosting(data: CreateJobPostingData): Promise<JobPosting> {
    return this.request<JobPosting>('/recruitment/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateJobPosting(id: string, data: Partial<CreateJobPostingData>): Promise<JobPosting> {
    return this.request<JobPosting>(`/recruitment/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async publishJobPosting(id: string): Promise<JobPosting> {
    return this.request<JobPosting>(`/recruitment/jobs/${id}/publish`, { method: 'PATCH' });
  }

  async closeJobPosting(id: string): Promise<JobPosting> {
    return this.request<JobPosting>(`/recruitment/jobs/${id}/close`, { method: 'PATCH' });
  }

  async getApplicants(jobId: string, filters?: { stage?: string }): Promise<Applicant[]> {
    const params = new URLSearchParams();
    if (filters?.stage) params.append('stage', filters.stage);
    const query = params.toString();
    return this.request<Applicant[]>(`/recruitment/jobs/${jobId}/applicants${query ? `?${query}` : ''}`);
  }

  async getApplicant(id: string): Promise<Applicant> {
    return this.request<Applicant>(`/recruitment/applicants/${id}`);
  }

  async createApplicant(jobId: string, data: CreateApplicantData): Promise<Applicant> {
    return this.request<Applicant>(`/recruitment/jobs/${jobId}/applicants`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApplicantStage(id: string, stage: string, notes?: string): Promise<Applicant> {
    return this.request<Applicant>(`/recruitment/applicants/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage, stageNotes: notes }),
    });
  }

  async deleteApplicant(id: string): Promise<void> {
    await this.request<void>(`/recruitment/applicants/${id}`, { method: 'DELETE' });
  }

  async getInterviews(applicantId: string): Promise<Interview[]> {
    return this.request<Interview[]>(`/recruitment/applicants/${applicantId}/interviews`);
  }

  async scheduleInterview(applicantId: string, data: { scheduledAt: string; duration?: number; location?: string; interviewType?: string; round?: number; interviewerId?: string }): Promise<Interview> {
    return this.request<Interview>(`/recruitment/applicants/${applicantId}/interviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitInterviewFeedback(id: string, data: { feedback: string; rating: number; recommendation: string }): Promise<Interview> {
    return this.request<Interview>(`/recruitment/interviews/${id}/feedback`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ==================== Training Endpoints ====================

  async getTrainingCourses(filters?: { status?: string; category?: string }): Promise<TrainingCourse[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    const query = params.toString();
    return this.request<TrainingCourse[]>(`/training/courses${query ? `?${query}` : ''}`);
  }

  async getTrainingCourse(id: string): Promise<TrainingCourse> {
    return this.request<TrainingCourse>(`/training/courses/${id}`);
  }

  async createTrainingCourse(data: CreateTrainingCourseData): Promise<TrainingCourse> {
    return this.request<TrainingCourse>('/training/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTrainingCourse(id: string, data: Partial<CreateTrainingCourseData>): Promise<TrainingCourse> {
    return this.request<TrainingCourse>(`/training/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTrainingCourse(id: string): Promise<void> {
    await this.request<void>(`/training/courses/${id}`, { method: 'DELETE' });
  }

  async getTrainingEnrollments(courseId: string): Promise<TrainingEnrollment[]> {
    return this.request<TrainingEnrollment[]>(`/training/courses/${courseId}/enrollments`);
  }

  async getMyEnrollments(): Promise<TrainingEnrollment[]> {
    return this.request<TrainingEnrollment[]>('/training/enrollments/my');
  }

  async enrollInCourse(courseId: string, employeeId?: string): Promise<TrainingEnrollment> {
    return this.request<TrainingEnrollment>(`/training/courses/${courseId}/enroll`, {
      method: 'POST',
      body: JSON.stringify(employeeId ? { employeeId } : {}),
    });
  }

  async updateEnrollmentProgress(id: string, progress: number): Promise<TrainingEnrollment> {
    return this.request<TrainingEnrollment>(`/training/enrollments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ progress }),
    });
  }

  async completeEnrollment(id: string, data: { score?: number; passed?: boolean }): Promise<TrainingEnrollment> {
    return this.request<TrainingEnrollment>(`/training/enrollments/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ==================== Asset Management Endpoints ====================

  async getAssets(filters?: { status?: string; category?: string; assignedTo?: string }): Promise<Asset[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
    const query = params.toString();
    return this.request<Asset[]>(`/assets${query ? `?${query}` : ''}`);
  }

  async getAsset(id: string): Promise<Asset> {
    return this.request<Asset>(`/assets/${id}`);
  }

  async createAsset(data: CreateAssetData): Promise<Asset> {
    return this.request<Asset>('/assets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAsset(id: string, data: Partial<CreateAssetData>): Promise<Asset> {
    return this.request<Asset>(`/assets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAsset(id: string): Promise<void> {
    await this.request<void>(`/assets/${id}`, { method: 'DELETE' });
  }

  async assignAsset(id: string, data: { employeeId: string; notes?: string }): Promise<Asset> {
    return this.request<Asset>(`/assets/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async returnAsset(id: string, data: { notes?: string; conditionOnReturn?: string }): Promise<Asset> {
    return this.request<Asset>(`/assets/${id}/return`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAssetHistory(id: string): Promise<AssetAssignment[]> {
    return this.request<AssetAssignment[]>(`/assets/${id}/history`);
  }

  // ==================== Expense Management Endpoints ====================

  async getExpenses(filters?: { status?: string; category?: string; employeeId?: string }): Promise<ExpenseClaim[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    const query = params.toString();
    return this.request<ExpenseClaim[]>(`/expenses${query ? `?${query}` : ''}`);
  }

  async getMyExpenses(): Promise<ExpenseClaim[]> {
    return this.request<ExpenseClaim[]>('/expenses/my');
  }

  async getExpense(id: string): Promise<ExpenseClaim> {
    return this.request<ExpenseClaim>(`/expenses/${id}`);
  }

  async createExpense(data: CreateExpenseClaimData): Promise<ExpenseClaim> {
    return this.request<ExpenseClaim>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExpense(id: string, data: Partial<CreateExpenseClaimData>): Promise<ExpenseClaim> {
    return this.request<ExpenseClaim>(`/expenses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteExpense(id: string): Promise<void> {
    await this.request<void>(`/expenses/${id}`, { method: 'DELETE' });
  }

  async approveExpense(id: string, notes?: string): Promise<ExpenseClaim> {
    return this.request<ExpenseClaim>(`/expenses/${id}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ approvalNotes: notes }),
    });
  }

  async rejectExpense(id: string, notes?: string): Promise<ExpenseClaim> {
    return this.request<ExpenseClaim>(`/expenses/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ approvalNotes: notes }),
    });
  }

  async reimburseExpense(id: string, amount?: number): Promise<ExpenseClaim> {
    return this.request<ExpenseClaim>(`/expenses/${id}/reimburse`, {
      method: 'PATCH',
      body: JSON.stringify({ reimbursedAmount: amount }),
    });
  }

  // ==================== Shift Management Endpoints ====================

  async getShifts(): Promise<ShiftDefinition[]> {
    return this.request<ShiftDefinition[]>('/shifts');
  }

  async getShift(id: string): Promise<ShiftDefinition> {
    return this.request<ShiftDefinition>(`/shifts/${id}`);
  }

  async createShift(data: CreateShiftDefinitionData): Promise<ShiftDefinition> {
    return this.request<ShiftDefinition>('/shifts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateShift(id: string, data: Partial<CreateShiftDefinitionData>): Promise<ShiftDefinition> {
    return this.request<ShiftDefinition>(`/shifts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteShift(id: string): Promise<void> {
    await this.request<void>(`/shifts/${id}`, { method: 'DELETE' });
  }

  async getShiftAssignments(filters?: { employeeId?: string; startDate?: string; endDate?: string }): Promise<ShiftAssignment[]> {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const query = params.toString();
    return this.request<ShiftAssignment[]>(`/shifts/assignments${query ? `?${query}` : ''}`);
  }

  async getMyShiftAssignments(): Promise<ShiftAssignment[]> {
    return this.request<ShiftAssignment[]>('/shifts/assignments/my');
  }

  async assignShift(shiftId: string, data: { employeeId: string; assignmentDate: string; endDate?: string; notes?: string }): Promise<ShiftAssignment> {
    return this.request<ShiftAssignment>(`/shifts/${shiftId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteShiftAssignment(id: string): Promise<void> {
    await this.request<void>(`/shifts/assignments/${id}`, { method: 'DELETE' });
  }

  // ==================== Policy Management Endpoints ====================

  async getPolicies(filters?: { status?: string; category?: string }): Promise<Policy[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    const query = params.toString();
    return this.request<Policy[]>(`/policies${query ? `?${query}` : ''}`);
  }

  async getPolicy(id: string): Promise<Policy> {
    return this.request<Policy>(`/policies/${id}`);
  }

  async createPolicy(data: CreatePolicyData): Promise<Policy> {
    return this.request<Policy>('/policies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePolicy(id: string, data: Partial<CreatePolicyData>): Promise<Policy> {
    return this.request<Policy>(`/policies/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async publishPolicy(id: string): Promise<Policy> {
    return this.request<Policy>(`/policies/${id}/publish`, { method: 'PATCH' });
  }

  async deletePolicy(id: string): Promise<void> {
    await this.request<void>(`/policies/${id}`, { method: 'DELETE' });
  }

  async acknowledgePolicy(id: string): Promise<PolicyAcknowledgment> {
    return this.request<PolicyAcknowledgment>(`/policies/${id}/acknowledge`, { method: 'POST' });
  }

  async getPolicyAcknowledgments(id: string): Promise<PolicyAcknowledgment[]> {
    return this.request<PolicyAcknowledgment[]>(`/policies/${id}/acknowledgments`);
  }

  async getMyAcknowledgments(): Promise<PolicyAcknowledgment[]> {
    return this.request<PolicyAcknowledgment[]>('/policies/acknowledgments/my');
  }

  // ==================== File Upload Endpoints ====================

  /**
   * Upload employee photo
   */
  async uploadEmployeePhoto(employeeId: string, file: File): Promise<{ photoUrl: string }> {
    const formData = new FormData();
    formData.append('photo', file);

    const authToken = this.accessToken;
    const url = `${this.baseUrl}/employees/${employeeId}/photo`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      credentials: 'include',
      body: formData,
    });

    const data: ApiResponse<{ photoUrl: string }> = await response.json();

    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      const message = Array.isArray(errorData.error.message)
        ? errorData.error.message.join(', ')
        : errorData.error.message;
      throw new ApiError(errorData.error.statusCode, message);
    }

    return (data as ApiSuccessResponse<{ photoUrl: string }>).data;
  }

  /**
   * Upload company logo
   */
  async uploadCompanyLogo(file: File): Promise<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('logo', file);

    const authToken = this.accessToken;
    const url = `${this.baseUrl}/company/logo`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      credentials: 'include',
      body: formData,
    });

    const data: ApiResponse<{ logoUrl: string }> = await response.json();

    if (!response.ok || !data.success) {
      const errorData = data as ApiErrorResponse;
      const message = Array.isArray(errorData.error.message)
        ? errorData.error.message.join(', ')
        : errorData.error.message;
      throw new ApiError(errorData.error.statusCode, message);
    }

    return (data as ApiSuccessResponse<{ logoUrl: string }>).data;
  }

  // ==================== Generic Request Methods ====================

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };

// Re-export all domain types from dedicated types file
export * from './api/types';

// Domain types (Department, Designation, Attendance, Leave, Payroll, User, Company,
// AuditLog, Notification, Invitation, Document, ApiKey, Webhook, CustomField,
// ImportExport, SSO, Performance, Recruitment, Training, Asset, Expense, Shift,
// Policy) are defined in './api/types.ts' and re-exported above.
