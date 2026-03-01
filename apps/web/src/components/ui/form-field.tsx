'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

/* ─────────────── Label ─────────────── */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  ),
);
Label.displayName = 'Label';

/* ─────────────── Input ─────────────── */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors duration-150',
        error
          ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500'
          : 'border-input',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

/* ─────────────── Textarea ─────────────── */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors duration-150 resize-y',
        error
          ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500'
          : 'border-input',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

/* ─────────────── Select ─────────────── */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, options, placeholder, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors duration-150 appearance-none',
        error
          ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500'
          : 'border-input',
        className,
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
);
Select.displayName = 'Select';

/* ─────────────── FormField (Wrapper) ─────────────── */
export interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
      {!error && hint && (
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      )}
    </div>
  );
}
