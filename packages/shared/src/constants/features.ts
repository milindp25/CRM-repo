/**
 * Feature Flags System
 * Defines available features and their tier mappings
 */

import { SubscriptionTier } from '../enums/status.enum';

/** All available platform features */
export enum Feature {
  // Core HR
  EMPLOYEES = 'EMPLOYEES',
  DEPARTMENTS = 'DEPARTMENTS',
  DESIGNATIONS = 'DESIGNATIONS',
  ATTENDANCE = 'ATTENDANCE',
  LEAVE = 'LEAVE',

  // Financial
  PAYROLL = 'PAYROLL',

  // Analytics & Compliance
  REPORTS = 'REPORTS',
  AUDIT_LOGS = 'AUDIT_LOGS',

  // Enterprise
  DOCUMENTS = 'DOCUMENTS',
  WORKFLOWS = 'WORKFLOWS',
  CUSTOM_FIELDS = 'CUSTOM_FIELDS',

  // Growth Modules
  PERFORMANCE = 'PERFORMANCE',
  RECRUITMENT = 'RECRUITMENT',
  TRAINING = 'TRAINING',
  ASSETS = 'ASSETS',
  EXPENSES = 'EXPENSES',
  SHIFTS = 'SHIFTS',
  POLICIES = 'POLICIES',

  // Integration
  API_ACCESS = 'API_ACCESS',
  WEBHOOKS = 'WEBHOOKS',
  SSO = 'SSO',

  // Phase 6: Competitive Features
  OFFBOARDING = 'OFFBOARDING',
  LEAVE_POLICIES = 'LEAVE_POLICIES',
  SURVEYS = 'SURVEYS',
  DIRECTORY = 'DIRECTORY',
  TIME_TRACKING = 'TIME_TRACKING',
  CONTRACTORS = 'CONTRACTORS',
  ANALYTICS = 'ANALYTICS',
  DASHBOARD_CONFIG = 'DASHBOARD_CONFIG',

  // Paid Add-ons (not included in any tier)
  PAYSLIP_ARCHIVE = 'PAYSLIP_ARCHIVE',
}

/** Features included in each subscription tier */
export const TIER_FEATURES: Record<SubscriptionTier, Feature[]> = {
  [SubscriptionTier.FREE]: [
    Feature.EMPLOYEES,
    Feature.DEPARTMENTS,
    Feature.DESIGNATIONS,
    Feature.ATTENDANCE,
    Feature.LEAVE,
  ],

  [SubscriptionTier.BASIC]: [
    Feature.EMPLOYEES,
    Feature.DEPARTMENTS,
    Feature.DESIGNATIONS,
    Feature.ATTENDANCE,
    Feature.LEAVE,
    Feature.PAYROLL,
    Feature.REPORTS,
    Feature.DIRECTORY,
    Feature.DASHBOARD_CONFIG,
  ],

  [SubscriptionTier.PROFESSIONAL]: [
    Feature.EMPLOYEES,
    Feature.DEPARTMENTS,
    Feature.DESIGNATIONS,
    Feature.ATTENDANCE,
    Feature.LEAVE,
    Feature.PAYROLL,
    Feature.REPORTS,
    Feature.AUDIT_LOGS,
    Feature.DOCUMENTS,
    Feature.WORKFLOWS,
    Feature.CUSTOM_FIELDS,
    Feature.LEAVE_POLICIES,
    Feature.OFFBOARDING,
    Feature.TIME_TRACKING,
    Feature.DIRECTORY,
    Feature.DASHBOARD_CONFIG,
  ],

  [SubscriptionTier.ENTERPRISE]: Object.values(Feature),
};

/** Human-readable feature labels */
export const FEATURE_LABELS: Record<Feature, string> = {
  [Feature.EMPLOYEES]: 'Employee Management',
  [Feature.DEPARTMENTS]: 'Department Management',
  [Feature.DESIGNATIONS]: 'Designation Management',
  [Feature.ATTENDANCE]: 'Attendance Tracking',
  [Feature.LEAVE]: 'Leave Management',
  [Feature.PAYROLL]: 'Payroll Management',
  [Feature.REPORTS]: 'Reports & Analytics',
  [Feature.AUDIT_LOGS]: 'Audit Logs',
  [Feature.DOCUMENTS]: 'Document Management',
  [Feature.WORKFLOWS]: 'Approval Workflows',
  [Feature.CUSTOM_FIELDS]: 'Custom Fields',
  [Feature.PERFORMANCE]: 'Performance Management',
  [Feature.RECRUITMENT]: 'Recruitment / ATS',
  [Feature.TRAINING]: 'Training / LMS',
  [Feature.ASSETS]: 'Asset Management',
  [Feature.EXPENSES]: 'Expense Management',
  [Feature.SHIFTS]: 'Shift Management',
  [Feature.POLICIES]: 'Policy Management',
  [Feature.API_ACCESS]: 'API Access',
  [Feature.WEBHOOKS]: 'Webhooks',
  [Feature.SSO]: 'Single Sign-On (SSO)',
  [Feature.OFFBOARDING]: 'Employee Offboarding',
  [Feature.LEAVE_POLICIES]: 'Leave Policies & Accrual',
  [Feature.SURVEYS]: 'Pulse Surveys',
  [Feature.DIRECTORY]: 'Employee Directory',
  [Feature.TIME_TRACKING]: 'Time Tracking',
  [Feature.CONTRACTORS]: 'Contractor Management',
  [Feature.ANALYTICS]: 'HR Analytics',
  [Feature.DASHBOARD_CONFIG]: 'Configurable Dashboards',
  [Feature.PAYSLIP_ARCHIVE]: 'Payslip Archive',
};

/** Feature descriptions for admin UI */
export const FEATURE_DESCRIPTIONS: Record<Feature, string> = {
  [Feature.EMPLOYEES]: 'Manage employee records, profiles, and employment details',
  [Feature.DEPARTMENTS]: 'Organize teams with hierarchical department structure',
  [Feature.DESIGNATIONS]: 'Define job titles, levels, and salary bands',
  [Feature.ATTENDANCE]: 'Track daily attendance, check-in/out, and WFH',
  [Feature.LEAVE]: 'Apply, approve, and manage leave requests',
  [Feature.PAYROLL]: 'Process salaries, deductions, and generate payslips',
  [Feature.REPORTS]: 'Generate HR reports with export capabilities',
  [Feature.AUDIT_LOGS]: 'Track all system actions for compliance',
  [Feature.DOCUMENTS]: 'Store and manage employee documents',
  [Feature.WORKFLOWS]: 'Configure multi-step approval workflows',
  [Feature.CUSTOM_FIELDS]: 'Add custom data fields to entities',
  [Feature.PERFORMANCE]: 'Goals, OKRs, and performance review cycles',
  [Feature.RECRUITMENT]: 'Job postings, applicant tracking, and hiring pipeline',
  [Feature.TRAINING]: 'Training courses, enrollment, and completion tracking',
  [Feature.ASSETS]: 'Track company assets assigned to employees',
  [Feature.EXPENSES]: 'Expense claims and reimbursement management',
  [Feature.SHIFTS]: 'Shift scheduling and rotation management',
  [Feature.POLICIES]: 'Company policies, handbooks, and acknowledgment tracking',
  [Feature.API_ACCESS]: 'API keys for external integrations',
  [Feature.WEBHOOKS]: 'Event-driven webhooks for third-party systems',
  [Feature.SSO]: 'SAML/OAuth single sign-on for enterprise',
  [Feature.OFFBOARDING]: 'Employee exit management with checklists and final settlement',
  [Feature.LEAVE_POLICIES]: 'Leave accrual policies, carryover rules, and balance tracking',
  [Feature.SURVEYS]: 'Pulse surveys, engagement surveys, and NPS scoring',
  [Feature.DIRECTORY]: 'Employee directory with search, celebrations, and social feed',
  [Feature.TIME_TRACKING]: 'Project timesheets, time entries, and overtime tracking',
  [Feature.CONTRACTORS]: 'Contractor profiles, contracts, and invoice management',
  [Feature.ANALYTICS]: 'Advanced HR analytics with headcount, attrition, and cost trends',
  [Feature.DASHBOARD_CONFIG]: 'Customizable role-based dashboard layouts and widgets',
  [Feature.PAYSLIP_ARCHIVE]: 'Archive and access historical payslips and tax documents',
};
