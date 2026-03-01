'use client';

import Link from 'next/link';
import { ShieldOff } from 'lucide-react';

interface AccessDeniedProps {
  title?: string;
  message?: string;
}

export function AccessDenied({
  title = 'Access Denied',
  message = "You don't have permission to view this page. Contact your administrator if you believe this is an error.",
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
        <ShieldOff className="w-8 h-8 text-red-600" />
      </div>
      <h1 className="text-2xl font-semibold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground text-center max-w-md mb-6">{message}</p>
      <Link
        href="/dashboard"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
