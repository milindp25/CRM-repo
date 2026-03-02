import * as React from 'react';
import { cn } from '@/lib/cn';

export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' | 'cyan' | 'orange';

export interface StatusBadgeProps {
  variant: StatusVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  neutral: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const dotStyles: Record<StatusVariant, string> = {
  success: 'bg-green-500 dark:bg-green-400',
  warning: 'bg-amber-500 dark:bg-amber-400',
  error: 'bg-red-500 dark:bg-red-400',
  info: 'bg-blue-500 dark:bg-blue-400',
  neutral: 'bg-gray-500 dark:bg-gray-400',
  purple: 'bg-purple-500 dark:bg-purple-400',
  cyan: 'bg-cyan-500 dark:bg-cyan-400',
  orange: 'bg-orange-500 dark:bg-orange-400',
};

/**
 * Centralized status mapping for common HR statuses.
 * Use this to get a consistent variant for any status string.
 */
export const statusToVariant: Record<string, StatusVariant> = {
  // Generic
  ACTIVE: 'success',
  INACTIVE: 'neutral',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'neutral',
  COMPLETED: 'success',
  DRAFT: 'neutral',
  IN_PROGRESS: 'info',
  OVERDUE: 'error',

  // Attendance
  PRESENT: 'success',
  ABSENT: 'error',
  LATE: 'warning',
  ON_LEAVE: 'info',
  HALF_DAY: 'orange',
  WEEKEND: 'neutral',
  HOLIDAY: 'purple',
  WORK_FROM_HOME: 'cyan',

  // Leave
  SICK: 'orange',
  CASUAL: 'info',
  MATERNITY: 'purple',
  PATERNITY: 'purple',

  // Payroll
  PROCESSED: 'success',
  PROCESSING: 'info',
  FAILED: 'error',
  PAID: 'success',
  UNPAID: 'error',
  PENDING_APPROVAL: 'warning',
  CHANGES_REQUESTED: 'orange',

  // Employment
  PROBATION: 'warning',
  CONFIRMED: 'success',
  TERMINATED: 'error',
  RESIGNED: 'neutral',
  NOTICE_PERIOD: 'warning',
  RETIRED: 'neutral',

  // Recruitment
  OPEN: 'success',
  CLOSED: 'neutral',
  ON_HOLD: 'warning',
  SHORTLISTED: 'info',
  HIRED: 'success',
  INTERVIEW: 'purple',
  OFFERED: 'cyan',

  // Training
  ENROLLED: 'info',
  NOT_STARTED: 'neutral',
  PASSED: 'success',
  ONGOING: 'info',

  // Performance
  EXCEPTIONAL: 'success',
  EXCEEDS_EXPECTATIONS: 'success',
  MEETS_EXPECTATIONS: 'info',
  NEEDS_IMPROVEMENT: 'warning',
  UNSATISFACTORY: 'error',

  // Assets
  AVAILABLE: 'success',
  ASSIGNED: 'info',
  UNDER_MAINTENANCE: 'warning',
  RETIRED_ASSET: 'neutral',
  LOST: 'error',
  DAMAGED: 'error',

  // Expenses
  SUBMITTED: 'info',
  REIMBURSED: 'success',
  PARTIALLY_PAID: 'warning',

  // General
  YES: 'success',
  NO: 'error',
  ENABLED: 'success',
  DISABLED: 'neutral',
  TRUE: 'success',
  FALSE: 'error',

  // Subscription
  TRIAL: 'warning',
  EXPIRED: 'error',
  FREE: 'info',
  BASIC: 'info',
  PROFESSIONAL: 'purple',
  ENTERPRISE: 'cyan',
};

/**
 * Get a StatusVariant for any status string (case-insensitive).
 * Falls back to 'neutral' for unrecognized statuses.
 */
export function getStatusVariant(status: string): StatusVariant {
  const normalized = status.toUpperCase().replace(/[\s-]/g, '_');
  return statusToVariant[normalized] || 'neutral';
}

export function StatusBadge({ variant, children, dot = false, className, size = 'sm' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        variantStyles[variant],
        className,
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', dotStyles[variant])} />
      )}
      {children}
    </span>
  );
}
