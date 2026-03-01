'use client';

/**
 * Employee Detail Component
 * View employee details with formatted data
 */

import { useEmployee } from '@/hooks/use-employee';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Mail, Phone, Calendar, MapPin, Briefcase, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { StatusBadge, getStatusVariant } from '@/components/ui/status-badge';
import { ErrorBanner } from '@/components/ui/error-banner';

interface EmployeeDetailProps {
  employeeId: string;
}

export function EmployeeDetail({ employeeId }: EmployeeDetailProps) {
  const router = useRouter();
  const { employee, loading, error, refetch } = useEmployee(employeeId);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await apiClient.deleteEmployee(employeeId);
      router.push('/employees');
    } catch (error) {
      console.error('Failed to delete employee:', error);
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getEmploymentTypeLabel = (type: string) => {
    switch (type) {
      case 'FULL_TIME':
        return 'Full Time';
      case 'PART_TIME':
        return 'Part Time';
      case 'CONTRACT':
        return 'Contract';
      case 'INTERN':
        return 'Intern';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-3 text-muted-foreground">Loading employee details...</span>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBanner message={error || 'Employee not found'} onRetry={() => refetch()} onDismiss={() => router.push('/employees')} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            {employee.photoUrl ? (
              <img
                src={employee.photoUrl}
                alt={`${employee.firstName} ${employee.lastName}`}
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                {employee.firstName[0]}{employee.lastName[0]}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {employee.firstName} {employee.middleName ? employee.middleName + ' ' : ''}{employee.lastName}
              </h1>
              <p className="mt-1 text-lg text-muted-foreground">{employee.employeeCode}</p>
              <div className="mt-2">
                <StatusBadge variant={getStatusVariant(employee.status)}>{employee.status}</StatusBadge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/employees/${employeeId}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Contact Information */}
        <div className="bg-card shadow-md rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Work Email</p>
                <p className="font-medium text-foreground">{employee.workEmail}</p>
              </div>
            </div>
            {employee.personalEmail && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Personal Email</p>
                  <p className="font-medium text-foreground">{employee.personalEmail}</p>
                </div>
              </div>
            )}
            {employee.workPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Work Phone</p>
                  <p className="font-medium text-foreground">{employee.workPhone}</p>
                </div>
              </div>
            )}
            {employee.personalPhone && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Personal Phone</p>
                  <p className="font-medium text-foreground">{employee.personalPhone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Employment Details */}
        <div className="bg-card shadow-md rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Employment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date of Joining</p>
                <p className="font-medium text-foreground">{formatDate(employee.dateOfJoining)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Employment Type</p>
                <p className="font-medium text-foreground">{getEmploymentTypeLabel(employee.employmentType)}</p>
              </div>
            </div>
            {employee.department && (
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium text-foreground">{employee.department.name}</p>
                <p className="text-sm text-muted-foreground">{employee.department.code}</p>
              </div>
            )}
            {employee.designation && (
              <div>
                <p className="text-sm text-muted-foreground">Designation</p>
                <p className="font-medium text-foreground">{employee.designation.title}</p>
                {employee.designation.level && (
                  <p className="text-sm text-muted-foreground">Level {employee.designation.level}</p>
                )}
              </div>
            )}
            {employee.reportingManager && (
              <div>
                <p className="text-sm text-muted-foreground">Reporting Manager</p>
                <p className="font-medium text-foreground">
                  {employee.reportingManager.firstName} {employee.reportingManager.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{employee.reportingManager.employeeCode}</p>
              </div>
            )}
            {employee.probationEndDate && (
              <div>
                <p className="text-sm text-muted-foreground">Probation End Date</p>
                <p className="font-medium text-foreground">{new Date(employee.probationEndDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-card shadow-md rounded-lg p-6 border border-border">
          <h2 className="text-xl font-semibold text-foreground mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {employee.dateOfBirth && (
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium text-foreground">{formatDate(employee.dateOfBirth)}</p>
              </div>
            )}
            {employee.gender && (
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium text-foreground">{employee.gender}</p>
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        {(employee.addressLine1 || employee.city || employee.state || employee.country) && (
          <div className="bg-card shadow-md rounded-lg p-6 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Address</h2>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                {employee.addressLine1 && <p className="text-foreground">{employee.addressLine1}</p>}
                {employee.addressLine2 && <p className="text-foreground">{employee.addressLine2}</p>}
                <p className="text-foreground">
                  {[employee.city, employee.state, employee.postalCode].filter(Boolean).join(', ')}
                </p>
                {employee.country && <p className="text-foreground">{employee.country}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Government IDs */}
        {(employee.aadhaar || employee.pan || employee.passport) && (
          <div className="bg-card shadow-md rounded-lg p-6 border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Government IDs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {employee.aadhaar && (
                <div>
                  <p className="text-sm text-muted-foreground">Aadhaar</p>
                  <p className="font-medium text-foreground">{employee.aadhaar}</p>
                </div>
              )}
              {employee.pan && (
                <div>
                  <p className="text-sm text-muted-foreground">PAN</p>
                  <p className="font-medium text-foreground">{employee.pan}</p>
                </div>
              )}
              {employee.passport && (
                <div>
                  <p className="text-sm text-muted-foreground">Passport</p>
                  <p className="font-medium text-foreground">{employee.passport}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
