'use client';

/**
 * Org Chart Component
 * Interactive department hierarchy tree visualization
 */

import { useState, useEffect } from 'react';
import { apiClient, type Department } from '@/lib/api-client';
import {
  Building2,
  ChevronRight,
  ChevronDown,
  Users,
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface OrgChartProps {
  compact?: boolean;
}

export function OrgChart({ compact = false }: OrgChartProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getDepartmentHierarchy();
      setDepartments(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load org chart');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive p-3 bg-destructive/10 rounded-lg">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        No departments configured
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {departments.map((dept) => (
        <DepartmentTreeNode key={dept.id} department={dept} level={0} compact={compact} />
      ))}
    </div>
  );
}

function DepartmentTreeNode({
  department,
  level,
  compact,
}: {
  department: Department;
  level: number;
  compact: boolean;
}) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = department.children && department.children.length > 0;

  const levelColors = [
    'border-blue-400 bg-blue-50 dark:bg-blue-900/20',
    'border-green-400 bg-green-50 dark:bg-green-900/20',
    'border-purple-400 bg-purple-50 dark:bg-purple-900/20',
    'border-orange-400 bg-orange-50 dark:bg-orange-900/20',
    'border-pink-400 bg-pink-50 dark:bg-pink-900/20',
  ];
  const colorClass = levelColors[level % levelColors.length];

  return (
    <div style={{ marginLeft: level > 0 ? `${level * 20}px` : '0' }}>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-l-4 ${colorClass} cursor-pointer hover:opacity-80 transition-opacity ${
          compact ? 'py-1.5' : 'py-2'
        }`}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )
        ) : (
          <div className="w-4" />
        )}

        <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {department.name}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {department.code}
            </span>
            {!department.isActive && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                Inactive
              </span>
            )}
          </div>
          {!compact && department.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {department.description}
            </p>
          )}
        </div>

        {department.employeeCount !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
            <Users className="w-3.5 h-3.5" />
            {department.employeeCount}
          </div>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="mt-1 space-y-1">
          {department.children!.map((child) => (
            <DepartmentTreeNode
              key={child.id}
              department={child}
              level={level + 1}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
