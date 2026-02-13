/**
 * New Employee Page
 * Server Component - Create employee form
 */

import { Metadata } from 'next';
import { EmployeeForm } from '@/components/employees/employee-form';

export const metadata: Metadata = {
  title: 'New Employee | HR Platform',
  description: 'Add a new employee',
};

export default function NewEmployeePage() {
  return <EmployeeForm mode="create" />;
}
