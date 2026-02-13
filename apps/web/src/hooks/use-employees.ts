'use client';

/**
 * Employees Hook
 * Provides employee list state and filtering
 */

import { useState, useEffect, useCallback } from 'react';
import {
  apiClient,
  ApiError,
  type Employee,
  type EmployeeFilters,
  type EmployeePaginationResponse,
} from '@/lib/api-client';

interface UseEmployeesResult {
  employees: Employee[];
  pagination: EmployeePaginationResponse['meta'] | null;
  loading: boolean;
  error: string | null;
  filters: EmployeeFilters;
  setFilters: (filters: Partial<EmployeeFilters>) => void;
  resetFilters: () => void;
  refetch: () => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  clearError: () => void;
}

const defaultFilters: EmployeeFilters = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * useEmployees Hook
 * Manages employee list state with filtering and pagination
 */
export function useEmployees(initialFilters?: Partial<EmployeeFilters>): UseEmployeesResult {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pagination, setPagination] = useState<EmployeePaginationResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<EmployeeFilters>({
    ...defaultFilters,
    ...initialFilters,
  });

  /**
   * Fetch employees with current filters
   */
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getEmployees(filters);
      setEmployees(response.data);
      setPagination(response.meta);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch employees';
      setError(errorMessage);
      setEmployees([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Fetch employees when filters change
   */
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  /**
   * Update filters (merges with existing filters)
   */
  const setFilters = useCallback((newFilters: Partial<EmployeeFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change (except when changing page)
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  }, []);

  /**
   * Reset filters to default
   */
  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  /**
   * Refetch with current filters
   */
  const refetch = useCallback(async () => {
    await fetchEmployees();
  }, [fetchEmployees]);

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    if (pagination?.hasNextPage) {
      setFiltersState(prev => ({
        ...prev,
        page: (prev.page || 1) + 1,
      }));
    }
  }, [pagination]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    if (pagination?.hasPreviousPage) {
      setFiltersState(prev => ({
        ...prev,
        page: Math.max((prev.page || 1) - 1, 1),
      }));
    }
  }, [pagination]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback((page: number) => {
    if (pagination && page >= 1 && page <= pagination.totalPages) {
      setFiltersState(prev => ({
        ...prev,
        page,
      }));
    }
  }, [pagination]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
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
    goToPage,
    clearError,
  };
}
