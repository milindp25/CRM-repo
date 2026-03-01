import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Login | HRPlatform',
  description: 'Sign in to your HRPlatform account'
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Feature showcase (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
        {/* Background pattern — dots (matches register) */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="dots" width="5" height="5" patternUnits="userSpaceOnUse">
                <circle cx="2.5" cy="2.5" r="0.8" fill="white" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#dots)" />
          </svg>
        </div>

        {/* Floating shapes */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-cyan-400/10 rounded-full blur-2xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <span className="font-bold text-lg">HR</span>
              </div>
              <span className="text-xl font-semibold">HRPlatform</span>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold leading-tight mb-4">
                Manage your workforce<br />with confidence
              </h2>
              <p className="text-purple-100 text-lg max-w-md">
                Run payroll in minutes, track who&apos;s in the office, manage time off, and keep your team happy — all from one simple dashboard.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {['Payroll', 'Attendance', 'Time Off', 'Reviews', 'Hiring', 'Reports'].map((feature) => (
                <span
                  key={feature}
                  className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-white/10"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-4">
              <div>
                <p className="text-3xl font-bold">20hrs</p>
                <p className="text-purple-200 text-sm">Saved Weekly</p>
              </div>
              <div>
                <p className="text-3xl font-bold">500+</p>
                <p className="text-purple-200 text-sm">Happy Teams</p>
              </div>
              <div>
                <p className="text-3xl font-bold">60sec</p>
                <p className="text-purple-200 text-sm">Quick Setup</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-purple-200 text-sm">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Bank-level security
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Your data stays safe
            </span>
          </div>
        </div>
      </div>

      {/* Right Panel — Login form */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-2 p-6">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">HR</span>
          </div>
          <span className="text-lg font-semibold text-foreground">HRPlatform</span>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[420px] space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Welcome back
              </h1>
              <p className="text-muted-foreground">
                Sign in to your account to continue
              </p>
            </div>

            <LoginForm />

            <p className="text-center text-xs text-muted-foreground pt-4">
              By signing in, you agree to our{' '}
              <a href="#" className="text-primary hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
