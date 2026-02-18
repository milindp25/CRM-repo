/**
 * Static Test Data Fixtures
 * Consistent test data for specific test scenarios
 */

export const TEST_USER = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'test.user@example.com',
  firstName: 'Test',
  lastName: 'User',
  password: 'Password123!',
  passwordHash: '$2a$10$testHashValue',
  role: 'EMPLOYEE',
  companyId: '22222222-2222-2222-2222-222222222222',
};

export const TEST_ADMIN = {
  id: '33333333-3333-3333-3333-333333333333',
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  password: 'AdminPass123!',
  passwordHash: '$2a$10$adminHashValue',
  role: 'COMPANY_ADMIN',
  companyId: '22222222-2222-2222-2222-222222222222',
};

export const TEST_COMPANY = {
  id: '22222222-2222-2222-2222-222222222222',
  companyCode: 'TEST001',
  companyName: 'Test Company Inc',
  email: 'contact@testcompany.com',
  subscriptionTier: 'BASIC',
  subscriptionStatus: 'ACTIVE',
};

export const INVALID_UUID = 'invalid-uuid-format';

export const VALID_JWT_SECRET = 'test-jwt-secret-min-32-characters-long';

export const TEST_DATES = {
  PAST: new Date('2023-01-01'),
  RECENT: new Date('2024-01-01'),
  FUTURE: new Date('2026-12-31'),
};

export const TEST_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  TEST_PAGE: 2,
  TEST_LIMIT: 10,
};
