'use client';

/**
 * Employee Table Row Component
 * Individual row in employee table with actions
 */

import { useState } from 'react';
import { MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import type { Employee } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

interface EmployeeTableRowProps {
  employee: Employee;
  onDelete: (id: string) => void;
}

export function EmployeeTableRow({ employee, onDelete }: EmployeeTableRowProps) {
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'ON_NOTICE':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESIGNED':
        return 'bg-gray-100 text-gray-800';
      case 'TERMINATED':
        return 'bg-red-100 text-red-800';
      case 'ON_LEAVE':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'ON_NOTICE':
        return 'On Notice';
      case 'RESIGNED':
        return 'Resigned';
      case 'TERMINATED':
        return 'Terminated';
      case 'ON_LEAVE':
        return 'On Leave';
      default:
        return status;
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(employee.id);
    } catch (error) {
      console.error('Failed to delete employee:', error);
    } finally {
      setIsDeleting(false);
      setShowActions(false);
    }
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Employee Code */}
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => router.push(`/employees/${employee.id}`)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {employee.employeeCode}
        </button>
      </td>

      {/* Name */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
              {employee.firstName[0]}{employee.lastName[0]}
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {employee.firstName} {employee.middleName ? employee.middleName + ' ' : ''}{employee.lastName}
            </div>
            <div className="text-sm text-gray-500">{employee.workEmail}</div>
          </div>
        </div>
      </td>

      {/* Department */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {employee.department?.name || '-'}
        </div>
        {employee.department?.code && (
          <div className="text-sm text-gray-500">{employee.department.code}</div>
        )}
      </td>

      {/* Designation */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {employee.designation?.title || '-'}
        </div>
        {employee.designation?.level && (
          <div className="text-sm text-gray-500">Level {employee.designation.level}</div>
        )}
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
          {getStatusLabel(employee.status)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
        <button
          onClick={() => setShowActions(!showActions)}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {showActions && (
          <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
            <div className="py-1">
              <button
                onClick={() => {
                  router.push(`/employees/${employee.id}`);
                  setShowActions(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Eye className="h-4 w-4" />
                View Details
              </button>
              <button
                onClick={() => {
                  router.push(`/employees/${employee.id}/edit`);
                  setShowActions(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}
