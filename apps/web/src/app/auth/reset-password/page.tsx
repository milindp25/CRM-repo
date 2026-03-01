import Link from 'next/link';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

export const metadata = {
  title: 'Reset Password | HRPlatform',
  description: 'Set a new password for your HRPlatform account'
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">HR</span>
            </div>
            <span className="text-xl font-bold text-foreground">HRPlatform</span>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-card rounded-2xl shadow-xl border border-border p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Reset Password
              </h1>
              <p className="text-muted-foreground">
                Enter your new password below
              </p>
            </div>

            {/* Form — wrapped in Suspense because useSearchParams() needs it */}
            <Suspense fallback={
              <div className="flex justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            }>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
