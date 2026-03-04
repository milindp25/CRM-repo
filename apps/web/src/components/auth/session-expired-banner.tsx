'use client';

import { AlertTriangle } from 'lucide-react';

export function SessionExpiredBanner() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm">
        Your session has expired. Please sign in again to continue.
      </p>
    </div>
  );
}
