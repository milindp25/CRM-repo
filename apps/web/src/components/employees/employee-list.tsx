'use client';

/**
 * Employee List Component
 * Table with search, filters, and pagination
 */

import { useEmployees } from '@/hooks/use-employees';
import { EmployeeFiltersComponent } from './employee-filters';
import { EmployeeTableRow } from './employee-table-row';
import { apiClient } from '@/lib/api-client';
import { ChevronLeft, ChevronRight, UserPlus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Employees</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employees</h1>
            <p className="mt-2 text-muted-foreground">Manage your workforce</p>
          </div>
          <button
            onClick={() => router.push('/employees/new')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            <UserPlus className="h-5 w-5" />
            New Employee
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <EmployeeFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
        />
      </div>

      {/* Table */}
      <div className="bg-card shadow-md rounded-lg overflow-hidden border border-border overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-muted-foreground">Loading employees...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-20">
            <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No employees found</h3>
            <p className="mt-2 text-muted-foreground">
              {filters.search || filters.status || filters.employmentType
                ? 'Try adjusting your filters'
                : 'Get started by adding your first employee'}
            </p>
            {!filters.search && !filters.status && !filters.employmentType && (
              <button
                onClick={() => router.push('/employees/new')}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="h-5 w-5" />
                Add Employee
              </button>
            )}
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Employee Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap hidden lg:table-cell">
                    Designation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {employees.map((employee) => (
                  <EmployeeTableRow
                    key={employee.id}
                    employee={employee}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="bg-card px-6 py-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="text-sm text-foreground">
                  {pagination && (
                    <>
                      Showing{' '}
                      <span className="font-medium">
                        {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.totalItems}</span> employees
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevPage}
                    disabled={!pagination?.hasPreviousPage || loading}
                    className="flex items-center gap-1 px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-foreground">
                    Page {pagination?.currentPage} of {pagination?.totalPages}
                  </span>
                  <button
                    onClick={nextPage}
                    disabled={!pagination?.hasNextPage || loading}
                    className="flex items-center gap-1 px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
