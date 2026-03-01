'use client';

import { useEmployees } from '@/hooks/use-employees';
import { EmployeeFiltersComponent } from './employee-filters';
import { EmployeeTableRow } from './employee-table-row';
import { apiClient } from '@/lib/api-client';
import { ChevronLeft, ChevronRight, UserPlus, Loader2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RoleGate } from '@/components/common/role-gate';
import { Permission } from '@hrplatform/shared';
import { PageContainer } from '@/components/ui/page-container';
import { ErrorBanner } from '@/components/ui/error-banner';

export function EmployeeList() {
  const router = useRouter();
  const {
    employees,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    resetFilters,
    refetch,
    nextPage,
    prevPage,
  } = useEmployees();

  const handleDelete = async (id: string) => {
    await apiClient.deleteEmployee(id);
    await refetch();
  };

  return (
    <PageContainer
      title="Employees"
      description="Manage your workforce"
      breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Employees' }]}
      actions={
        <RoleGate requiredPermissions={[Permission.MANAGE_EMPLOYEES]} hideOnly>
          <button
            onClick={() => router.push('/employees/new')}
            className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            New Employee
          </button>
        </RoleGate>
      }
    >
      {error && (
        <ErrorBanner message={error} onDismiss={() => {}} onRetry={() => refetch()} />
      )}

      {/* Filters */}
      <div className="mb-1">
        <EmployeeFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <span className="ml-3 text-muted-foreground">Loading employees...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No employees found</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              {filters.search || filters.status || filters.employmentType
                ? 'Try adjusting your filters'
                : 'Get started by adding your first employee'}
            </p>
            {!filters.search && !filters.status && !filters.employmentType && (
              <RoleGate requiredPermissions={[Permission.MANAGE_EMPLOYEES]} hideOnly>
                <button
                  onClick={() => router.push('/employees/new')}
                  className="mt-4 inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Employee
                </button>
              </RoleGate>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Employee Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                      Department
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
                      Designation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {employees.map((employee) => (
                    <EmployeeTableRow
                      key={employee.id}
                      employee={employee}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {pagination && (
                    <>
                      Showing{' '}
                      <span className="font-medium text-foreground">
                        {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium text-foreground">
                        {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                      </span>{' '}
                      of <span className="font-medium text-foreground">{pagination.totalItems}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevPage}
                    disabled={!pagination?.hasPreviousPage || loading}
                    className="inline-flex items-center gap-1 h-9 px-3 text-sm font-medium border border-input rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="px-3 text-sm text-muted-foreground">
                    Page {pagination?.currentPage} of {pagination?.totalPages}
                  </span>
                  <button
                    onClick={nextPage}
                    disabled={!pagination?.hasNextPage || loading}
                    className="inline-flex items-center gap-1 h-9 px-3 text-sm font-medium border border-input rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
