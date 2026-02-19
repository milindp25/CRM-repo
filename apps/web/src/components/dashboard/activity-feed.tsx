'use client';

/**
 * Activity Feed Component
 * Shows a timeline of recent actions from the AuditLog system
 */

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  User,
  FileText,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  Download,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  success: boolean;
  failureReason?: string;
  createdAt: string;
}

const ACTION_ICONS: Record<string, typeof User> = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  EXPORT: Download,
  READ: FileText,
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  LOGIN: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  LOGOUT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  EXPORT: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  READ: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
};

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatResourceType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getActionDescription(action: string, resourceType: string): string {
  const resource = formatResourceType(resourceType).toLowerCase();
  switch (action) {
    case 'CREATE': return `Created a ${resource}`;
    case 'UPDATE': return `Updated a ${resource}`;
    case 'DELETE': return `Deleted a ${resource}`;
    case 'LOGIN': return 'Signed in';
    case 'LOGOUT': return 'Signed out';
    case 'EXPORT': return `Exported ${resource}`;
    case 'READ': return `Viewed ${resource}`;
    default: return `${action} ${resource}`;
  }
}

interface ActivityFeedProps {
  limit?: number;
  compact?: boolean;
}

export function ActivityFeed({ limit = 10, compact = false }: ActivityFeedProps) {
  const [activities, setActivities] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchActivities();
  }, [limit]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAuditLogs({ take: limit });
      setActivities(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-2 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
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

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity, index) => {
        const Icon = ACTION_ICONS[activity.action] || FileText;
        const colorClass = ACTION_COLORS[activity.action] || ACTION_COLORS.READ;

        return (
          <div
            key={activity.id}
            className={`flex items-start gap-3 ${compact ? 'py-2' : 'py-3'} ${
              index < activities.length - 1 ? 'border-b border-border' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
              {activity.success ? (
                <Icon className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-medium">{activity.userEmail?.split('@')[0] || 'System'}</span>
                {' '}
                <span className="text-muted-foreground">
                  {getActionDescription(activity.action, activity.resourceType)}
                </span>
              </p>
              {!activity.success && activity.failureReason && (
                <p className="text-xs text-destructive mt-0.5 truncate">
                  {activity.failureReason}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {getRelativeTime(activity.createdAt)}
              </p>
            </div>
            {!compact && activity.success && (
              <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}
