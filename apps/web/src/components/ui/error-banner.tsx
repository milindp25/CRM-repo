'use client';

import { AlertTriangle, X, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
}

/**
 * Industry-standard inline error banner with dismiss and optional retry
 */
export function ErrorBanner({ message, onDismiss, onRetry, className = '' }: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30 ${className}`}>
      <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0" />
      <p className="flex-1 text-sm text-red-700 dark:text-red-300">{message}</p>
      <div className="flex items-center gap-1 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 rounded-md hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Empty state placeholder for lists/tables with no data
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
