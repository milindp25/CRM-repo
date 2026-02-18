import { z } from 'zod';
import { emailSchema, passwordSchema, simplePasswordSchema } from './common.schema';

/**
 * Authentication Validation Schemas
 */

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: simplePasswordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;

// Register schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).trim(),
  companyName: z.string().min(1, 'Company name is required').max(100).trim(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Refresh token schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: simplePasswordSchema,
  newPassword: passwordSchema,
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Reset password request schema
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Verify email schema
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
