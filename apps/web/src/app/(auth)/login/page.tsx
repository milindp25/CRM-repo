import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = {
  title: 'Login | HRPlatform',
  description: 'Sign in to your HRPlatform account'
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">HR</span>
            </div>
            <span className="text-xl font-bold text-gray-900">HRPlatform</span>
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Sign in to access your account
              </p>
            </div>

            {/* Form */}
            <LoginForm />
          </div>

          {/* Footer Text */}
          <p className="mt-8 text-center text-sm text-gray-600">
            By signing in, you agree to our{' '}
            <a
              href="#"
              className="text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="#"
              className="text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-1"
            >
              Privacy Policy
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
