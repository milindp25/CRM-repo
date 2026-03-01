'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/contexts/auth-context';
import { Eye, EyeOff, Loader2, AlertCircle, AlertTriangle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score: 2, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score: 3, label: 'Good', color: 'bg-amber-500' };
  if (score <= 4) return { score: 4, label: 'Strong', color: 'bg-green-500' };
  return { score: 5, label: 'Very Strong', color: 'bg-emerald-500' };
}

export function RegisterForm() {
  const { register, loading, error: authError, clearError } = useAuthContext();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: ''
  });
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [companyWarning, setCompanyWarning] = useState('');
  const [checkingCompany, setCheckingCompany] = useState(false);

  const error = authError || localError;
  const passwordStrength = formData.password ? getPasswordStrength(formData.password) : null;
  const passwordMismatch = formData.confirmPassword && formData.password !== formData.confirmPassword;

  const checkCompanyName = useCallback(async (name: string) => {
    if (!name || name.trim().length < 2) {
      setCompanyWarning('');
      return;
    }
    setCheckingCompany(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/check-company?name=${encodeURIComponent(name.trim())}`);
      const data = await res.json();
      if (data.exists) {
        setCompanyWarning('A company with this name already exists. If this is your company, please contact your administrator.');
      } else {
        setCompanyWarning('');
      }
    } catch {
      // Silent fail — not critical
      setCompanyWarning('');
    } finally {
      setCheckingCompany(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    // Validation
    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters long');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (!formData.companyName.trim()) {
      setLocalError('Company name is required');
      return;
    }

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
      }, true);
    } catch (err: any) {
      console.error('Registration error:', err);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div
          className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Name Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="firstName" className="text-sm font-medium text-foreground">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            autoComplete="given-name"
            required
            value={formData.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            className="w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50"
            placeholder="John"
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="lastName" className="text-sm font-medium text-foreground">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            autoComplete="family-name"
            required
            value={formData.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            className="w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50"
            placeholder="Doe"
            disabled={loading}
          />
        </div>
      </div>

      {/* Company Name */}
      <div className="space-y-1.5">
        <label htmlFor="companyName" className="text-sm font-medium text-foreground">
          Company Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="companyName"
            type="text"
            autoComplete="organization"
            required
            value={formData.companyName}
            onChange={(e) => updateField('companyName', e.target.value)}
            onBlur={(e) => checkCompanyName(e.target.value)}
            className="w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50"
            placeholder="Acme Corporation"
            disabled={loading}
          />
          {checkingCompany && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
          )}
        </div>
        {companyWarning && (
          <div className="flex items-start gap-2 mt-1.5 px-3 py-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-amber-700 dark:text-amber-400">{companyWarning}</span>
          </div>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Work Email <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          className="w-full h-10 px-3 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50"
          placeholder="you@company.com"
          disabled={loading}
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={formData.password}
            onChange={(e) => updateField('password', e.target.value)}
            className="w-full h-10 px-3 pr-10 border border-input bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50"
            placeholder="Min. 8 characters"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {/* Password strength bar */}
        {passwordStrength && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    level <= passwordStrength.score ? passwordStrength.color : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{passwordStrength.label}</p>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={formData.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            className={`w-full h-10 px-3 pr-10 border bg-background text-foreground rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50 ${
              passwordMismatch ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500' : 'border-input'
            }`}
            placeholder="Re-enter your password"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {passwordMismatch && (
          <p className="text-xs text-red-500">Passwords do not match</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !!passwordMismatch}
        className="w-full h-11 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating your account...
          </span>
        ) : (
          'Create Account'
        )}
      </button>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}
