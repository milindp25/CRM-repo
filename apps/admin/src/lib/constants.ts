/** Shared color constants for admin portal badges and status indicators */

export const tierColors: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  BASIC: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  PROFESSIONAL: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
  ENTERPRISE: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
};

export const statusColors: Record<string, string> = {
  TRIAL: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
  EXPIRED: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  SUSPENDED: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
};

export const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  COMPANY_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
  HR_ADMIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  MANAGER: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
  EMPLOYEE: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
};

export const invoiceStatusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  PAID: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
};
