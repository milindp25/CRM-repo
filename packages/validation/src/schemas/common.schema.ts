import { z } from 'zod';

/**
 * Common Reusable Validation Schemas
 */

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .trim();

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Simple password (for login, no complexity requirements)
export const simplePasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

// Phone number validation (optional)
export const phoneSchema = z
  .string()
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number format')
  .optional();

// UUID validation
export const uuidSchema = z
  .string()
  .uuid('Invalid ID format');

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

// Search query schema
export const searchSchema = z.object({
  query: z.string().min(1).max(100).optional(),
  ...paginationSchema.shape,
});
