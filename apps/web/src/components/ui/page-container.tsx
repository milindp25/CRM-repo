'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageContainerProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  /** data-tour attribute for product tour targeting */
  tourId?: string;
}

export function PageContainer({
  title,
  description,
  actions,
  breadcrumbs,
  children,
  className,
  fullWidth = false,
  tourId,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'min-h-full',
        !fullWidth && 'max-w-7xl mx-auto',
        'px-4 sm:px-6 lg:px-8 py-6 space-y-6',
        className,
      )}
      data-tour={tourId}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className={index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
