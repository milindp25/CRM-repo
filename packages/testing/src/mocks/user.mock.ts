import { faker } from '@faker-js/faker';
import { UserRole } from '@hrplatform/shared';

/**
 * Mock User Generator
 * Creates fake user data for testing
 */
export const mockUser = (overrides?: Partial<any>) => ({
  id: faker.string.uuid(),
  email: faker.internet.email().toLowerCase(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  phone: faker.phone.number(),
  avatar: faker.image.avatar(),
  role: UserRole.EMPLOYEE,
  permissions: ['VIEW_EMPLOYEES', 'MARK_ATTENDANCE'],
  companyId: faker.string.uuid(),
  employeeId: faker.string.uuid(),
  isActive: true,
  emailVerified: true,
  passwordHash: '$2a$10$mockHashForTesting',
  lastLoginAt: faker.date.recent(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  deletedAt: null,
  ...overrides,
});

/**
 * Mock Company Admin User
 */
export const mockAdminUser = (overrides?: Partial<any>) =>
  mockUser({
    role: UserRole.COMPANY_ADMIN,
    permissions: ['ALL'],
    ...overrides,
  });

/**
 * Mock HR Admin User
 */
export const mockHRUser = (overrides?: Partial<any>) =>
  mockUser({
    role: UserRole.HR_ADMIN,
    permissions: [
      'MANAGE_EMPLOYEES',
      'MANAGE_ATTENDANCE',
      'MANAGE_LEAVES',
      'MANAGE_PAYROLL',
    ],
    ...overrides,
  });

/**
 * Mock Manager User
 */
export const mockManagerUser = (overrides?: Partial<any>) =>
  mockUser({
    role: UserRole.MANAGER,
    permissions: ['VIEW_EMPLOYEES', 'APPROVE_LEAVE', 'APPROVE_ATTENDANCE'],
    ...overrides,
  });

/**
 * Mock Multiple Users
 */
export const mockUsers = (count: number = 5, overrides?: Partial<any>) => {
  return Array.from({ length: count }, () => mockUser(overrides));
};
