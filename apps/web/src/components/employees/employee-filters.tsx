'use client';

/**
 * Employee Filters Component
 * Search and filter UI for employee list
 */

import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import type { EmployeeFilters } from '@/lib/api-client';

interface EmployeeFiltersProps {
  filters: EmployeeFilters;
  onFiltersChange: (filters: Partial<EmployeeFilters>) => void;
  onReset: () => void;
}

export function EmployeeFiltersComponent({
  filters,
  onFiltersChange,
  onReset,
}: EmployeeFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ search: searchInput || undefined });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters.search, onFiltersChange]);

  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.employmentType ||
    filters.departmentId ||
    filters.designationId;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or employee code..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-all ${
            showFilters || hasActiveFilters
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Filter className="h-5 w-5" />
          Filters
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="px-4 py-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => onFiltersChange({ status: (e.target.value || undefined) as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_NOTICE">On Notice</option>
              <option value="RESIGNED">Resigned</option>
              <option value="TERMINATED">Terminated</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>

          {/* Employment Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Employment Type
            </label>
            <select
              value={filters.employmentType || ''}
              onChange={(e) => onFiltersChange({ employmentType: (e.target.value || undefined) as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERN">Intern</option>
            </select>
          </div>

          {/* Department Filter - TODO: Fetch from API */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Department
            </label>
            <select
              value={filters.departmentId || ''}
              onChange={(e) => onFiltersChange({ departmentId: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {/* TODO: Populate from API */}
            </select>
          </div>

          {/* Designation Filter - TODO: Fetch from API */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Designation
            </label>
            <select
              value={filters.designationId || ''}
              onChange={(e) => onFiltersChange({ designationId: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Designations</option>
              {/* TODO: Populate from API */}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
