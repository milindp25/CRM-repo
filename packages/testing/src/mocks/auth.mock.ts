import { faker } from '@faker-js/faker';
import { mockUser } from './user.mock';

/**
 * Mock JWT Payload
 */
export const mockJwtPayload = (overrides?: Partial<any>) => {
  const user = mockUser(overrides);
  return {
    userId: user.id,
    email: user.email,
    companyId: user.companyId,
    role: user.role,
    permissions: user.permissions,
  };
};

/**
 * Mock Access Token (fake JWT structure)
 */
export const mockAccessToken = () => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify(mockJwtPayload())).toString('base64url');
  const signature = faker.string.alphanumeric(43);
  return `${header}.${payload}.${signature}`;
};

/**
 * Mock Refresh Token
 */
export const mockRefreshToken = () => {
  return faker.string.alphanumeric(64);
};

/**
 * Mock Auth Response
 */
export const mockAuthResponse = (userOverrides?: Partial<any>) => {
  const user = mockUser(userOverrides);
  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId,
    },
    accessToken: mockAccessToken(),
    refreshToken: mockRefreshToken(),
  };
};

/**
 * Mock Login Credentials
 */
export const mockLoginCredentials = () => ({
  email: faker.internet.email().toLowerCase(),
  password: 'Password123!',
});

/**
 * Mock Register Data
 */
export const mockRegisterData = () => ({
  email: faker.internet.email().toLowerCase(),
  password: 'Password123!',
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  companyName: faker.company.name(),
});
