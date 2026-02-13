/**
 * API Client for NestJS Backend
 * Handles all HTTP requests to the standalone API server
 */

import type { UserProfile } from '@hrplatform/shared';
import { setToken, setRefreshToken, getToken, clearTokens as clearAllTokens } from './token-sync';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeData {
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
 */
class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

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
   * Make HTTP request to API
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { token, skipAuth, ...fetchOptions } = options;

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    // Add authorization header
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
      });

      // Parse response
      const data: ApiResponse<T> = await response.json();

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
    const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');

    if (!refreshToken) {
      throw new ApiError(401, 'No refresh token available');
    }

    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuth: true,
    });

    // Store new tokens
    const remember = !!localStorage.getItem('refresh_token');
    this.storeToken(response.accessToken, remember);
    this.storeRefreshToken(response.refreshToken, remember);

    return response;
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me');
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

// Department Types
export interface Department {
  id: string;
  companyId: string;
  name: string;
  code: string;
  description?: string;
  parent?: { id: string; name: string; code: string } | null;
  children?: { id: string; name: string; code: string }[];
  headEmployee?: { id: string; firstName: string; lastName: string; employeeCode: string } | null;
  costCenter?: string;
  isActive: boolean;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentData {
  name: string;
  code: string;
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

// Designation Types
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
  code: string;
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

// Attendance Types
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

// Leave Types
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

// Payroll Types
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

// Add these methods to the ApiClient class in the existing file
