/**
 * Employee Detail Page
 * Server Component - View employee details
 */

import { Metadata } from 'next';
import { EmployeeDetail } from '@/components/employees/employee-detail';

export const metadata: Metadata = {
  title: 'Employee Details | HR Platform',
  description: 'View employee information',
};

interface EmployeeDetailPageProps {
  params: {
    id: string;
  };
}

export default function EmployeeDetailPage({ params }: EmployeeDetailPageProps) {
  return <EmployeeDetail employeeId={params.id} />;
}
