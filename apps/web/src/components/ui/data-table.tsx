'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
} from 'lucide-react';

/* ─────────────── Types ─────────────── */

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: string;
  header: string;
  /** Custom cell renderer */
  render?: (row: T, index: number) => React.ReactNode;
  /** Enable sorting for this column */
  sortable?: boolean;
  /** Width class (e.g., 'w-48', 'min-w-[200px]') */
  width?: string;
  /** Alignment */
  align?: 'left' | 'center' | 'right';
  /** Hide on mobile */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Unique key for each row */
  keyExtractor: (row: T) => string;
  /** Search */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** Sorting */
  sortColumn?: string;
  sortDirection?: SortDirection;
  onSort?: (column: string, direction: SortDirection) => void;
  /** Pagination */
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** Selection */
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  /** Row click */
  onRowClick?: (row: T) => void;
  /** Toolbar extras (filters, bulk actions) */
  toolbar?: React.ReactNode;
  /** Empty state */
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  /** Sticky header (default: true) */
  stickyHeader?: boolean;
  /** Bulk actions toolbar (shown when rows are selected) */
  bulkActions?: (selectedKeys: Set<string>) => React.ReactNode;
  /** Loading */
  loading?: boolean;
  /** Custom row class */
  rowClassName?: (row: T) => string;
  className?: string;
}

/* ─────────────── Skeleton ─────────────── */

function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="h-4 bg-muted rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─────────────── Component ─────────────── */

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  sortColumn,
  sortDirection,
  onSort,
  page = 1,
  pageSize = 10,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  onRowClick,
  toolbar,
  emptyIcon,
  emptyTitle = 'No data found',
  emptyDescription = 'Try adjusting your search or filters.',
  emptyAction,
  stickyHeader = true,
  bulkActions,
  loading = false,
  rowClassName,
  className,
}: DataTableProps<T>) {
  const total = totalItems ?? data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const allSelected = data.length > 0 && data.every((row) => selectedKeys.has(keyExtractor(row)));
  const someSelected = data.some((row) => selectedKeys.has(keyExtractor(row)));

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      const next = new Set(selectedKeys);
      data.forEach((row) => next.delete(keyExtractor(row)));
      onSelectionChange(next);
    } else {
      const next = new Set(selectedKeys);
      data.forEach((row) => next.add(keyExtractor(row)));
      onSelectionChange(next);
    }
  };

  const handleSelectRow = (key: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onSelectionChange(next);
  };

  const handleSort = (col: Column<T>) => {
    if (!col.sortable || !onSort) return;
    let newDir: SortDirection;
    if (sortColumn !== col.key) {
      newDir = 'asc';
    } else if (sortDirection === 'asc') {
      newDir = 'desc';
    } else {
      newDir = null;
    }
    onSort(col.key, newDir);
  };

  const SortIcon = ({ col }: { col: Column<T> }) => {
    if (!col.sortable) return null;
    if (sortColumn !== col.key) return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    if (sortDirection === 'asc') return <ChevronUp className="h-3.5 w-3.5 text-primary" />;
    return <ChevronDown className="h-3.5 w-3.5 text-primary" />;
  };

  const alignClass = (align?: string) => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  return (
    <div className={cn('rounded-xl border bg-card text-card-foreground overflow-hidden', className)}>
      {/* Toolbar */}
      {(onSearchChange || toolbar) && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b">
          {onSearchChange && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchValue ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  'w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm text-foreground',
                  'placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
                  'transition-colors duration-150',
                )}
              />
            </div>
          )}
          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {/* Selection bar + bulk actions */}
      {selectable && selectedKeys.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border-b text-sm">
          <span className="font-medium text-primary">
            {selectedKeys.size} selected
          </span>
          {bulkActions && (
            <div className="flex items-center gap-2 ml-auto">
              {bulkActions(selectedKeys)}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className={cn('overflow-x-auto', stickyHeader && 'max-h-[calc(100vh-16rem)] overflow-y-auto')}>
        <table className="w-full">
          <thead>
            <tr className={cn('border-b bg-muted/30', stickyHeader && 'sticky top-0 z-10 bg-card shadow-sm')}>
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <button
                    onClick={handleSelectAll}
                    className={cn(
                      'h-4 w-4 rounded border flex items-center justify-center transition-colors',
                      allSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : someSelected
                          ? 'bg-primary/50 border-primary text-primary-foreground'
                          : 'border-input hover:border-primary/50',
                    )}
                    aria-label="Select all"
                  >
                    {(allSelected || someSelected) && <Check className="h-3 w-3" />}
                  </button>
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider',
                    alignClass(col.align),
                    col.width,
                    col.hideOnMobile && 'hidden md:table-cell',
                    col.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                  )}
                  onClick={() => handleSort(col)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    <SortIcon col={col} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)}>
                  <TableSkeleton columns={columns.length} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)}>
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    {emptyIcon && <div className="text-muted-foreground mb-3">{emptyIcon}</div>}
                    <h3 className="text-sm font-semibold text-foreground">{emptyTitle}</h3>
                    {emptyDescription && (
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">{emptyDescription}</p>
                    )}
                    {emptyAction && <div className="mt-4">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const key = keyExtractor(row);
                const isSelected = selectedKeys.has(key);
                return (
                  <tr
                    key={key}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-muted/50',
                      isSelected && 'bg-primary/5',
                      rowClassName?.(row),
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <td className="w-10 px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRow(key);
                          }}
                          className={cn(
                            'h-4 w-4 rounded border flex items-center justify-center transition-colors',
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-input hover:border-primary/50',
                          )}
                          aria-label={`Select row ${key}`}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </button>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3 text-sm',
                          alignClass(col.align),
                          col.width,
                          col.hideOnMobile && 'hidden md:table-cell',
                        )}
                      >
                        {col.render
                          ? col.render(row, idx)
                          : (row as Record<string, unknown>)[col.key]?.toString() ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {onPageChange && total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>
              Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
            </span>
            {onPageSizeChange && (
              <>
                <span className="mx-1">·</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size} / page
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <PaginationButton
              onClick={() => onPageChange(1)}
              disabled={page <= 1}
              label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </PaginationButton>
            <PaginationButton
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </PaginationButton>
            <span className="px-3 py-1 text-sm font-medium text-foreground">
              {page} / {totalPages}
            </span>
            <PaginationButton
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </PaginationButton>
            <PaginationButton
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages}
              label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </PaginationButton>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Helpers ─────────────── */

function PaginationButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center h-8 w-8 rounded-lg border text-sm transition-colors',
        disabled
          ? 'border-input text-muted-foreground/50 cursor-not-allowed'
          : 'border-input text-foreground hover:bg-muted hover:border-primary/20',
      )}
    >
      {children}
    </button>
  );
}
