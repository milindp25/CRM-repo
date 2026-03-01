'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Optional action area (e.g., time range selector) */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Height for the chart container */
  height?: number;
  loading?: boolean;
}

function ChartCardSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="rounded-xl border bg-card p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-3 w-48 bg-muted rounded" />
        </div>
        <div className="h-8 w-24 bg-muted rounded" />
      </div>
      <div className="bg-muted rounded-lg" style={{ height }} />
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
  height = 300,
  loading,
}: ChartCardProps) {
  if (loading) return <ChartCardSkeleton height={height} />;

  return (
    <div className={cn('rounded-xl border bg-card text-card-foreground p-6', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div className="space-y-0.5">
          <h3 className="font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      <div style={{ height }} className="w-full">
        {children}
      </div>
    </div>
  );
}

/**
 * CSS-variable-based chart colors for Recharts.
 * Use these to maintain consistent colors in light/dark mode.
 */
export const chartColors = {
  primary: 'hsl(var(--chart-1))',
  success: 'hsl(var(--chart-2))',
  warning: 'hsl(var(--chart-3))',
  danger: 'hsl(var(--chart-4))',
  purple: 'hsl(var(--chart-5))',
  cyan: 'hsl(var(--chart-6))',
};

/** Array form for use with Recharts color arrays */
export const chartColorArray = [
  chartColors.primary,
  chartColors.success,
  chartColors.warning,
  chartColors.danger,
  chartColors.purple,
  chartColors.cyan,
];
