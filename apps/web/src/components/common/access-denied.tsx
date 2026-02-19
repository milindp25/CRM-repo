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
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h1>
      <p className="text-gray-500 text-center max-w-md mb-6">{message}</p>
      <Link
        href="/dashboard"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
