import type { ComponentType } from 'react';
import {
  Home,
  Users,
  Calendar,
  Briefcase,
  DollarSign,
  Building2,
  Award,
  BarChart2,
  ClipboardList,
  Shield,
  Settings,
  UserCircle,
  ScrollText,
  ArrowUpDown,
  Target,
  UserPlus,
  GraduationCap,
  Package,
  Receipt,
  Clock,
  FileText,
  Network,
  Wallet,
  FileBarChart,
} from 'lucide-react';
import { Permission } from '@hrplatform/shared';

export interface NavItem {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  /** If true, visible to all authenticated users regardless of permissions */
  alwaysVisible?: boolean;
  /** User must have ANY of these permissions to see this item */
  requiredPermissions?: Permission[];
  /** Feature that must be enabled for this nav item to appear */
  requiredFeature?: string;
}

export const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    alwaysVisible: true,
  },
  {
    name: 'Employees',
    href: '/employees',
    icon: Users,
    requiredPermissions: [Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES],
    requiredFeature: 'EMPLOYEES',
  },
  {
    name: 'Departments',
    href: '/departments',
    icon: Building2,
    requiredPermissions: [Permission.VIEW_DEPARTMENTS, Permission.MANAGE_DEPARTMENTS],
    requiredFeature: 'DEPARTMENTS',
  },
  {
    name: 'Designations',
    href: '/designations',
    icon: Award,
    requiredPermissions: [Permission.VIEW_DESIGNATIONS, Permission.MANAGE_DESIGNATIONS],
    requiredFeature: 'DESIGNATIONS',
  },
  {
    name: 'Attendance',
    href: '/attendance',
    icon: Calendar,
    requiredPermissions: [Permission.VIEW_ATTENDANCE, Permission.MARK_ATTENDANCE, Permission.MANAGE_ATTENDANCE],
    requiredFeature: 'ATTENDANCE',
  },
  {
    name: 'Leave',
    href: '/leave',
    icon: Briefcase,
    requiredPermissions: [Permission.VIEW_LEAVES, Permission.APPLY_LEAVE, Permission.MANAGE_LEAVES],
    requiredFeature: 'LEAVE',
  },
  {
    name: 'Leave Balance',
    href: '/leave/balance',
    icon: ClipboardList,
    requiredPermissions: [Permission.VIEW_LEAVES, Permission.APPLY_LEAVE, Permission.MANAGE_LEAVES],
    requiredFeature: 'LEAVE',
  },
  {
    name: 'Payroll',
    href: '/payroll',
    icon: DollarSign,
    requiredPermissions: [Permission.VIEW_PAYROLL, Permission.VIEW_OWN_PAYROLL, Permission.MANAGE_PAYROLL],
    requiredFeature: 'PAYROLL',
  },
  {
    name: 'Salary Structures',
    href: '/payroll/salary-structures',
    icon: ClipboardList,
    requiredPermissions: [Permission.MANAGE_PAYROLL],
    requiredFeature: 'PAYROLL',
  },
  {
    name: 'My Payslips',
    href: '/payroll/my-payslips',
    icon: Wallet,
    requiredPermissions: [Permission.VIEW_OWN_PAYROLL],
    requiredFeature: 'PAYROLL',
  },
  {
    name: 'Compliance Reports',
    href: '/payroll/reports',
    icon: FileBarChart,
    requiredPermissions: [Permission.MANAGE_PAYROLL, Permission.GENERATE_REPORTS],
    requiredFeature: 'PAYROLL',
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart2,
    requiredPermissions: [Permission.VIEW_REPORTS, Permission.GENERATE_REPORTS],
    requiredFeature: 'REPORTS',
  },
  {
    name: 'Performance',
    href: '/performance',
    icon: Target,
    requiredPermissions: [Permission.VIEW_PERFORMANCE, Permission.MANAGE_PERFORMANCE, Permission.VIEW_OWN_PERFORMANCE],
    requiredFeature: 'PERFORMANCE',
  },
  {
    name: 'Recruitment',
    href: '/recruitment',
    icon: UserPlus,
    requiredPermissions: [Permission.VIEW_RECRUITMENT, Permission.MANAGE_RECRUITMENT],
    requiredFeature: 'RECRUITMENT',
  },
  {
    name: 'Training',
    href: '/training',
    icon: GraduationCap,
    requiredPermissions: [Permission.VIEW_TRAINING, Permission.MANAGE_TRAINING, Permission.ENROLL_TRAINING],
    requiredFeature: 'TRAINING',
  },
  {
    name: 'Assets',
    href: '/assets',
    icon: Package,
    requiredPermissions: [Permission.VIEW_ASSETS, Permission.MANAGE_ASSETS],
    requiredFeature: 'ASSETS',
  },
  {
    name: 'Expenses',
    href: '/expenses',
    icon: Receipt,
    requiredPermissions: [Permission.VIEW_EXPENSES, Permission.MANAGE_EXPENSES, Permission.SUBMIT_EXPENSE],
    requiredFeature: 'EXPENSES',
  },
  {
    name: 'Shifts',
    href: '/shifts',
    icon: Clock,
    requiredPermissions: [Permission.VIEW_SHIFTS, Permission.MANAGE_SHIFTS],
    requiredFeature: 'SHIFTS',
  },
  {
    name: 'Policies',
    href: '/policies',
    icon: FileText,
    requiredPermissions: [Permission.VIEW_POLICIES, Permission.MANAGE_POLICIES, Permission.ACKNOWLEDGE_POLICY],
    requiredFeature: 'POLICIES',
  },
  {
    name: 'Org Chart',
    href: '/org-chart',
    icon: Network,
    requiredPermissions: [Permission.VIEW_DEPARTMENTS, Permission.VIEW_EMPLOYEES],
    requiredFeature: 'DEPARTMENTS',
  },
  {
    name: 'Users',
    href: '/users',
    icon: Shield,
    requiredPermissions: [Permission.VIEW_USERS, Permission.MANAGE_USERS],
  },
  {
    name: 'Import/Export',
    href: '/import-export',
    icon: ArrowUpDown,
    requiredPermissions: [Permission.VIEW_EMPLOYEES, Permission.MANAGE_EMPLOYEES],
  },
  {
    name: 'Audit Logs',
    href: '/audit-logs',
    icon: ScrollText,
    requiredPermissions: [Permission.VIEW_AUDIT_LOGS],
    requiredFeature: 'AUDIT_LOGS',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    requiredPermissions: [Permission.MANAGE_COMPANY],
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: UserCircle,
    alwaysVisible: true,
  },
];
