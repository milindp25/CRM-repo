import { faker } from '@faker-js/faker';
import { SubscriptionTier, SubscriptionStatus } from '@hrplatform/shared';

/**
 * Mock Company Generator
 * Creates fake company data for testing
 */
export const mockCompany = (overrides?: Partial<any>) => ({
  id: faker.string.uuid(),
  companyCode: faker.string.alphanumeric(6).toUpperCase(),
  companyName: faker.company.name(),
  email: faker.internet.email().toLowerCase(),
  phone: faker.phone.number(),
  website: faker.internet.url(),
  addressLine1: faker.location.streetAddress(),
  addressLine2: faker.location.secondaryAddress(),
  city: faker.location.city(),
  state: faker.location.state(),
  country: faker.location.country(),
  postalCode: faker.location.zipCode(),
  subscriptionTier: SubscriptionTier.BASIC,
  subscriptionStatus: SubscriptionStatus.ACTIVE,
  trialEndsAt: faker.date.future(),
  settings: {},
  deploymentType: 'CLOUD',
  databaseSchema: null,
  featuresEnabled: ['ATTENDANCE', 'LEAVE', 'PAYROLL'],
  isActive: true,
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  deletedAt: null,
  ...overrides,
});

/**
 * Mock Free Tier Company
 */
export const mockFreeCompany = (overrides?: Partial<any>) =>
  mockCompany({
    subscriptionTier: SubscriptionTier.FREE,
    subscriptionStatus: SubscriptionStatus.TRIAL,
    featuresEnabled: ['ATTENDANCE', 'LEAVE'],
    ...overrides,
  });

/**
 * Mock Enterprise Company
 */
export const mockEnterpriseCompany = (overrides?: Partial<any>) =>
  mockCompany({
    subscriptionTier: SubscriptionTier.ENTERPRISE,
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    featuresEnabled: ['ATTENDANCE', 'LEAVE', 'PAYROLL', 'REPORTS', 'ANALYTICS'],
    ...overrides,
  });

/**
 * Mock Multiple Companies
 */
export const mockCompanies = (count: number = 3, overrides?: Partial<any>) => {
  return Array.from({ length: count }, () => mockCompany(overrides));
};
