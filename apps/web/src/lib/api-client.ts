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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
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

// User Management Types
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

// Company Types
export interface Company {
  id: string;
  companyName: string;
  companyCode: string;
  industry?: string;
  website?: string;
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
}

// Audit Log Types
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
  skip?: number;
  take?: number;
}

export interface AuditLogPaginationResponse {
  data: AuditLog[];
  total: number;
  skip: number;
  take: number;
}

// Notification Types
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

// Invitation Types
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

// Document Types
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

// API Key Types
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
  /** Full API key - only returned once at creation time */
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

// Webhook Types
export interface WebhookEndpoint {
  id: string;
  companyId: string;
  name: string;
  url: string;
  secret: string; // Masked in list/get responses
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

// Custom Field Types
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

// Import/Export Types
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

// SSO Types
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

// ==================== Phase 4: Growth Module Types ====================

// Performance Management Types
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

// Recruitment Types
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

// Training Types
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

// Asset Types
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

// Expense Types
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

// Shift Types
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

// Policy Types
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
