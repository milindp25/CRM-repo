'use client';

import React from 'react';

/**
 * Shimmer effect overlay for skeleton loading - gives a polished "scanning" effect
 */
function ShimmerOverlay() {
  return (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
  );
}

/**
 * Full-page skeleton loader with shimmer effect
 * Used as the loading state for dashboard pages
 */
export function PageLoader() {
  return (
    <div className="p-8">
      {/* Title skeleton */}
      <div className="mb-8">
        <div className="relative overflow-hidden h-7 bg-muted/70 rounded-md w-56 mb-2">
          <ShimmerOverlay />
        </div>
        <div className="relative overflow-hidden h-4 bg-muted rounded-md w-72">
          <ShimmerOverlay />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 shadow-sm">
            <div className="relative overflow-hidden h-3 bg-muted rounded w-20 mb-3">
              <ShimmerOverlay />
            </div>
            <div className="relative overflow-hidden h-7 bg-muted/70 rounded w-16 mb-1">
              <ShimmerOverlay />
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-muted/50">
          <div className="flex gap-10">
            {[16, 24, 20, 16, 14].map((w, i) => (
              <div key={i} className="relative overflow-hidden h-3 bg-muted/70 rounded" style={{ width: `${w * 4}px` }}>
                <ShimmerOverlay />
              </div>
            ))}
          </div>
        </div>
        {/* Rows */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-border">
            <div className="flex gap-10 items-center">
              {[20, 32, 24, 16, 16].map((w, j) => (
                <div key={j} className="relative overflow-hidden h-4 bg-muted/80 rounded" style={{ width: `${w * 4}px` }}>
                  <ShimmerOverlay />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Table-only skeleton loader
 * Used when the page header/filters are already rendered but table data is loading
 */
export function TableLoader({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="px-6 py-4 border-b border-border">
          <div className="flex gap-6 items-center">
            {[...Array(cols)].map((_, j) => (
              <div key={j} className="relative overflow-hidden h-4 bg-muted/80 rounded flex-1">
                <ShimmerOverlay />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
