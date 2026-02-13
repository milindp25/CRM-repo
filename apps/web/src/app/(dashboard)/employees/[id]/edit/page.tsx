/**
 * Edit Employee Page
 * Server Component - Edit employee form
 */

import { Metadata } from 'next';
import { EmployeeForm } from '@/components/employees/employee-form';

export const metadata: Metadata = {
  title: 'Edit Employee | HR Platform',
  description: 'Update employee information',
};

interface EditEmployeePageProps {
  params: {
    id: string;
  };
}

export default function EditEmployeePage({ params }: EditEmployeePageProps) {
  return <EmployeeForm mode="edit" employeeId={params.id} />;
}
