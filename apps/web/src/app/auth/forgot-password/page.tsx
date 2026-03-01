import Link from 'next/link';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata = {
  title: 'Forgot Password | HRPlatform',
  description: 'Reset your HRPlatform account password'
};

export default function ForgotPasswordPage() {
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
                Forgot Password
              </h1>
              <p className="text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            {/* Form */}
            <ForgotPasswordForm />
          </div>
        </div>
      </main>
    </div>
  );
}
