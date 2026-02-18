import { z } from 'zod';
import { emailSchema, phoneSchema, uuidSchema, paginationSchema } from './common.schema';
import { UserRole, Permission } from '@hrplatform/shared';

/**
 * User Validation Schemas
 */

// Create user schema
export const createUserSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).trim(),
  phone: phoneSchema,
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid role' }) }),
  permissions: z.array(z.nativeEnum(Permission)).default([]),
  companyId: uuidSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

// Update user schema
export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  phone: phoneSchema,
  avatar: z.string().url().optional(),
  role: z.nativeEnum(UserRole).optional(),
  permissions: z.array(z.nativeEnum(Permission)).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// Get users query schema
export const getUsersQuerySchema = paginationSchema.extend({
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
});

export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>;

// User ID param schema
export const userIdParamSchema = z.object({
  userId: uuidSchema,
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;
