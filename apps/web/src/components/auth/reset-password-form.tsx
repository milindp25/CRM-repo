'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-4 rounded-lg flex items-start">
          <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium">Invalid reset link</p>
            <p className="text-sm mt-1">This password reset link is missing the required token.</p>
          </div>
        </div>
        <div className="text-center text-sm text-gray-600">
          <Link
            href="/auth/forgot-password"
            className="font-medium text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 rounded px-1"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/\d/.test(newPassword)) {
      setError('Password must contain at least one number');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await apiClient.resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err: any) {
      const message = err?.message || 'Failed to reset password';
      if (message.includes('expired') || message.includes('invalid') || message.includes('Invalid')) {
        setError('This reset link has expired or has already been used. Please request a new one.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-4 rounded-lg flex items-start">
          <svg className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-medium">Password reset successful</p>
            <p className="text-sm mt-1">
              Your password has been updated. You can now sign in with your new password.
            </p>
          </div>
        </div>
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 font-semibold transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start"
          role="alert"
          aria-live="polite"
        >
          <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <span>{error}</span>
            {error.includes('expired') && (
              <p className="mt-2">
                <Link href="/auth/forgot-password" className="font-medium text-red-700 underline hover:text-red-600">
                  Request a new reset link
                </Link>
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
          New Password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-foreground transition-colors"
          placeholder="••••••••"
          aria-required="true"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          At least 8 characters with uppercase, lowercase, and a number
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary bg-background text-foreground transition-colors"
          placeholder="••••••••"
          aria-required="true"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Resetting...
          </span>
        ) : (
          'Reset Password'
        )}
      </button>

      <div className="text-center text-sm text-gray-600">
        <Link
          href="/login"
          className="font-medium text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 rounded px-1"
        >
          Back to login
        </Link>
      </div>
    </form>
  );
}
