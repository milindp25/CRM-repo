'use client';

/**
 * Employee Hook
 * Provides single employee state and CRUD operations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  apiClient,
  ApiError,
  type Employee,
  type CreateEmployeeData,
} from '@/lib/api-client';

interface UseEmployeeResult {
  employee: Employee | null;
  loading: boolean;
  error: string | null;
  createEmployee: (data: CreateEmployeeData) => Promise<Employee>;
  updateEmployee: (id: string, data: Partial<CreateEmployeeData>) => Promise<Employee>;
  deleteEmployee: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
  clearError: () => void;
}

/**
 * useEmployee Hook
 * Manages single employee state and operations
 */
export function useEmployee(id?: string): UseEmployeeResult {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch employee by ID
   */
  const fetchEmployee = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.getEmployee(id);
      setEmployee(data);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch employee';
      setError(errorMessage);
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  /**
   * Fetch employee when ID changes
   */
  useEffect(() => {
    if (id) {
      fetchEmployee();
    }
  }, [id, fetchEmployee]);

  /**
   * Create new employee
   */
  const createEmployee = useCallback(async (data: CreateEmployeeData): Promise<Employee> => {
    setLoading(true);
    setError(null);

    try {
      const created = await apiClient.createEmployee(data);
      setEmployee(created);
      return created;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to create employee';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update existing employee
   */
  const updateEmployee = useCallback(async (
    employeeId: string,
    data: Partial<CreateEmployeeData>
  ): Promise<Employee> => {
    setLoading(true);
    setError(null);

    try {
      const updated = await apiClient.updateEmployee(employeeId, data);
      setEmployee(updated);
      return updated;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to update employee';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete employee
   */
  const deleteEmployee = useCallback(async (employeeId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.deleteEmployee(employeeId);
      setEmployee(null);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete employee';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refetch current employee
   */
  const refetch = useCallback(async () => {
    await fetchEmployee();
  }, [fetchEmployee]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    employee,
    loading,
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    refetch,
    clearError,
  };
}
