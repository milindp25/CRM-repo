'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, Edit, Trash2 } from 'lucide-react';
import type { Employee } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';

interface EmployeeTableRowProps {
  employee: Employee;
  onDelete: (id: string) => void;
}

export function EmployeeTableRow({ employee, onDelete }: EmployeeTableRowProps) {
  const router = useRouter();
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLTableCellElement>(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showActions) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showActions]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ACTIVE: 'Active',
      ON_NOTICE: 'On Notice',
      RESIGNED: 'Resigned',
      TERMINATED: 'Terminated',
      ON_LEAVE: 'On Leave',
    };
    return labels[status] || status;
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
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
    <tr className="hover:bg-muted/30 transition-colors">
      {/* Employee Code */}
      <td className="px-4 py-3 whitespace-nowrap">
        <button
          onClick={() => router.push(`/employees/${employee.id}`)}
          className="font-mono text-xs text-primary hover:text-primary/80 hover:underline bg-muted px-1.5 py-0.5 rounded"
        >
          {employee.employeeCode}
        </button>
      </td>

      {/* Name */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-9 w-9 flex-shrink-0">
            {employee.photoUrl ? (
              <img
                src={employee.photoUrl}
                alt={`${employee.firstName} ${employee.lastName}`}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                {employee.firstName[0]}{employee.lastName[0]}
              </div>
            )}
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-foreground">
              {employee.firstName} {employee.middleName ? employee.middleName + ' ' : ''}{employee.lastName}
            </div>
            <div className="text-xs text-muted-foreground">{employee.workEmail}</div>
          </div>
        </div>
      </td>

      {/* Department */}
      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
        <div className="text-sm text-foreground">
          {employee.department?.name || '—'}
        </div>
        {employee.department?.code && (
          <div className="text-xs text-muted-foreground">{employee.department.code}</div>
        )}
      </td>

      {/* Designation */}
      <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
        <div className="text-sm text-foreground">
          {employee.designation?.title || '—'}
        </div>
        {employee.designation?.level && (
          <div className="text-xs text-muted-foreground">Level {employee.designation.level}</div>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        <StatusBadge variant={getStatusVariant(employee.status)} size="sm">
          {getStatusLabel(employee.status)}
        </StatusBadge>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap text-right text-sm relative" ref={menuRef}>
        <button
          onClick={() => setShowActions(!showActions)}
          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {showActions && (
          <div className="absolute right-4 mt-1 w-44 rounded-xl border bg-card shadow-lg z-20">
            <div className="py-1">
              <button
                onClick={() => {
                  router.push(`/employees/${employee.id}`);
                  setShowActions(false);
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Eye className="h-4 w-4 text-muted-foreground" />
                View Details
              </button>
              <button
                onClick={() => {
                  router.push(`/employees/${employee.id}/edit`);
                  setShowActions(false);
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Edit className="h-4 w-4 text-muted-foreground" />
                Edit
              </button>
              <div className="my-1 border-t border-border" />
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
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
