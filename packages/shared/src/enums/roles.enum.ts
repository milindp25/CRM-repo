/**
 * User Roles Enumeration
 * Defines the hierarchy and access levels in the system
 */
export enum UserRole {
  /**
   * Super Administrator - Cross-company access (managed by separate admin app)
   * Has full system access across all companies
   */
  SUPER_ADMIN = 'SUPER_ADMIN',

  /**
   * Company Administrator - Full access within their company
   * Can manage all aspects of their company
   */
  COMPANY_ADMIN = 'COMPANY_ADMIN',

  /**
   * HR Administrator - HR operations within company
   * Can manage employees, leaves, attendance, payroll
   */
  HR_ADMIN = 'HR_ADMIN',

  /**
   * Manager - Team management
   * Can manage their team members and approve leaves
   */
  MANAGER = 'MANAGER',

  /**
   * Employee - Basic user
   * Can view own data and apply for leaves
   */
  EMPLOYEE = 'EMPLOYEE',
}

/**
 * System Permissions Enumeration
 * Granular permissions for role-based access control
 */
export enum Permission {
  // Super Admin
  ALL = 'ALL',

  // User Management
  MANAGE_USERS = 'MANAGE_USERS',
  VIEW_USERS = 'VIEW_USERS',
  CREATE_USERS = 'CREATE_USERS',
  UPDATE_USERS = 'UPDATE_USERS',
  DELETE_USERS = 'DELETE_USERS',

  // Employee Management
  MANAGE_EMPLOYEES = 'MANAGE_EMPLOYEES',
  VIEW_EMPLOYEES = 'VIEW_EMPLOYEES',
  CREATE_EMPLOYEES = 'CREATE_EMPLOYEES',
  UPDATE_EMPLOYEES = 'UPDATE_EMPLOYEES',
  DELETE_EMPLOYEES = 'DELETE_EMPLOYEES',

  // Attendance Management
  MANAGE_ATTENDANCE = 'MANAGE_ATTENDANCE',
  VIEW_ATTENDANCE = 'VIEW_ATTENDANCE',
  MARK_ATTENDANCE = 'MARK_ATTENDANCE',
  APPROVE_ATTENDANCE = 'APPROVE_ATTENDANCE',

  // Leave Management
  MANAGE_LEAVES = 'MANAGE_LEAVES',
  VIEW_LEAVES = 'VIEW_LEAVES',
  APPLY_LEAVE = 'APPLY_LEAVE',
  APPROVE_LEAVE = 'APPROVE_LEAVE',
  CANCEL_LEAVE = 'CANCEL_LEAVE',

  // Payroll Management
  MANAGE_PAYROLL = 'MANAGE_PAYROLL',
  VIEW_PAYROLL = 'VIEW_PAYROLL',
  PROCESS_PAYROLL = 'PROCESS_PAYROLL',
  VIEW_OWN_PAYROLL = 'VIEW_OWN_PAYROLL',

  // Department Management
  MANAGE_DEPARTMENTS = 'MANAGE_DEPARTMENTS',
  VIEW_DEPARTMENTS = 'VIEW_DEPARTMENTS',

  // Designation Management
  MANAGE_DESIGNATIONS = 'MANAGE_DESIGNATIONS',
  VIEW_DESIGNATIONS = 'VIEW_DESIGNATIONS',

  // Company Settings
  MANAGE_COMPANY = 'MANAGE_COMPANY',
  VIEW_COMPANY = 'VIEW_COMPANY',

  // Reports
  VIEW_REPORTS = 'VIEW_REPORTS',
  GENERATE_REPORTS = 'GENERATE_REPORTS',

  // Audit Logs
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',

  // Performance Management
  VIEW_PERFORMANCE = 'VIEW_PERFORMANCE',
  MANAGE_PERFORMANCE = 'MANAGE_PERFORMANCE',
  VIEW_OWN_PERFORMANCE = 'VIEW_OWN_PERFORMANCE',
  SUBMIT_SELF_REVIEW = 'SUBMIT_SELF_REVIEW',

  // Recruitment / ATS
  VIEW_RECRUITMENT = 'VIEW_RECRUITMENT',
  MANAGE_RECRUITMENT = 'MANAGE_RECRUITMENT',
  CREATE_JOB_POSTINGS = 'CREATE_JOB_POSTINGS',
  MANAGE_APPLICANTS = 'MANAGE_APPLICANTS',

  // Training / LMS
  VIEW_TRAINING = 'VIEW_TRAINING',
  MANAGE_TRAINING = 'MANAGE_TRAINING',
  ENROLL_TRAINING = 'ENROLL_TRAINING',

  // Asset Management
  VIEW_ASSETS = 'VIEW_ASSETS',
  MANAGE_ASSETS = 'MANAGE_ASSETS',

  // Expense Management
  VIEW_EXPENSES = 'VIEW_EXPENSES',
  MANAGE_EXPENSES = 'MANAGE_EXPENSES',
  SUBMIT_EXPENSE = 'SUBMIT_EXPENSE',
  APPROVE_EXPENSE = 'APPROVE_EXPENSE',

  // Shift Management
  VIEW_SHIFTS = 'VIEW_SHIFTS',
  MANAGE_SHIFTS = 'MANAGE_SHIFTS',

  // Policy Management
  VIEW_POLICIES = 'VIEW_POLICIES',
  MANAGE_POLICIES = 'MANAGE_POLICIES',
  ACKNOWLEDGE_POLICY = 'ACKNOWLEDGE_POLICY',
}

/**
 * Role-Permission Mapping
 * Defines default permissions for each role
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [Permission.ALL],

  [UserRole.COMPANY_ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_EMPLOYEES,
    Permission.MANAGE_ATTENDANCE,
    Permission.MANAGE_LEAVES,
    Permission.MANAGE_PAYROLL,
    Permission.MANAGE_DEPARTMENTS,
    Permission.MANAGE_DESIGNATIONS,
    Permission.MANAGE_COMPANY,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_PERFORMANCE,
    Permission.MANAGE_RECRUITMENT,
    Permission.MANAGE_TRAINING,
    Permission.MANAGE_ASSETS,
    Permission.MANAGE_EXPENSES,
    Permission.MANAGE_SHIFTS,
    Permission.MANAGE_POLICIES,
  ],

  [UserRole.HR_ADMIN]: [
    Permission.VIEW_USERS,
    Permission.CREATE_USERS,
    Permission.UPDATE_USERS,
    Permission.MANAGE_EMPLOYEES,
    Permission.MANAGE_ATTENDANCE,
    Permission.MANAGE_LEAVES,
    Permission.MANAGE_PAYROLL,
    Permission.VIEW_DEPARTMENTS,
    Permission.VIEW_DESIGNATIONS,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.MANAGE_PERFORMANCE,
    Permission.MANAGE_RECRUITMENT,
    Permission.MANAGE_TRAINING,
    Permission.VIEW_ASSETS,
    Permission.MANAGE_EXPENSES,
    Permission.VIEW_SHIFTS,
    Permission.MANAGE_POLICIES,
  ],

  [UserRole.MANAGER]: [
    Permission.VIEW_USERS,
    Permission.VIEW_EMPLOYEES,
    Permission.VIEW_ATTENDANCE,
    Permission.APPROVE_ATTENDANCE,
    Permission.VIEW_LEAVES,
    Permission.APPROVE_LEAVE,
    Permission.VIEW_DEPARTMENTS,
    Permission.VIEW_DESIGNATIONS,
    Permission.VIEW_REPORTS,
    Permission.VIEW_PERFORMANCE,
    Permission.VIEW_RECRUITMENT,
    Permission.VIEW_TRAINING,
    Permission.VIEW_ASSETS,
    Permission.VIEW_EXPENSES,
    Permission.APPROVE_EXPENSE,
    Permission.VIEW_SHIFTS,
    Permission.VIEW_POLICIES,
  ],

  [UserRole.EMPLOYEE]: [
    Permission.VIEW_EMPLOYEES,
    Permission.MARK_ATTENDANCE,
    Permission.VIEW_ATTENDANCE,
    Permission.APPLY_LEAVE,
    Permission.VIEW_LEAVES,
    Permission.VIEW_OWN_PAYROLL,
    Permission.VIEW_DEPARTMENTS,
    Permission.VIEW_DESIGNATIONS,
    Permission.VIEW_OWN_PERFORMANCE,
    Permission.SUBMIT_SELF_REVIEW,
    Permission.ENROLL_TRAINING,
    Permission.VIEW_TRAINING,
    Permission.SUBMIT_EXPENSE,
    Permission.VIEW_EXPENSES,
    Permission.VIEW_SHIFTS,
    Permission.VIEW_POLICIES,
    Permission.ACKNOWLEDGE_POLICY,
  ],
};
