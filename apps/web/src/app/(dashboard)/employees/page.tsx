/**
 * Employees List Page
 * Server Component - Main entry point for employee management
 */

import { Metadata } from 'next';
import { EmployeeList } from '@/components/employees/employee-list';

export const metadata: Metadata = {
  title: 'Employees | HR Platform',
  description: 'Manage your workforce',
};

export default function EmployeesPage() {
  return <EmployeeList />;
}
