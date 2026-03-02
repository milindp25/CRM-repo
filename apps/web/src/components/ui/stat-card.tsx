'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  iconColor?: 'blue' | 'green' | 'amber' | 'purple' | 'cyan' | 'rose' | 'indigo' | 'orange';
  onClick?: () => void;
  className?: string;
  loading?: boolean;
}

const iconColorMap = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
  green: 'bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
  cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400',
};

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-8 w-16 bg-muted rounded" />
          <div className="h-3 w-32 bg-muted rounded" />
        </div>
        <div className="h-11 w-11 bg-muted rounded-xl" />
      </div>
    </div>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  iconColor = 'blue',
  onClick,
  className,
  loading,
}: StatCardProps) {
  if (loading) return <StatCardSkeleton />;

  const TrendIcon = trend
    ? trend.value > 0
      ? TrendingUp
      : trend.value < 0
        ? TrendingDown
        : Minus
    : null;

  const trendColor = trend
    ? trend.value > 0
      ? 'text-green-600 dark:text-green-400'
      : trend.value < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-muted-foreground'
    : '';

  return (
    <div
      className={cn(
        'rounded-xl border bg-card text-card-foreground p-6 transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          <div className="flex items-center gap-1.5 pt-1">
            {trend && TrendIcon && (
              <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', trendColor)}>
                <TrendIcon className="h-3.5 w-3.5" />
                {Math.abs(trend.value)}%
              </span>
            )}
            {(subtitle || trend?.label) && (
              <span className="text-xs text-muted-foreground truncate">
                {trend?.label || subtitle}
              </span>
            )}
            {!trend && subtitle && (
              <span className="text-xs text-muted-foreground truncate">{subtitle}</span>
            )}
          </div>
        </div>
        <div className={cn('flex-shrink-0 rounded-xl p-2.5', iconColorMap[iconColor])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
