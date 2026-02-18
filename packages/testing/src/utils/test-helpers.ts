/**
 * Test Helper Utilities
 */

/**
 * Wait for a specified number of milliseconds
 */
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate a unique test email
 */
export const generateTestEmail = (prefix: string = 'test') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${prefix}-${timestamp}-${random}@test.com`;
};

/**
 * Clean up test data (mock function - implement as needed)
 */
export const cleanupTestData = async (prisma: any) => {
  // This would be implemented in actual tests
  // await prisma.user.deleteMany({ where: { email: { contains: '@test.com' } } });
};

/**
 * Create test database transaction
 */
export const createTestTransaction = async (prisma: any, callback: (tx: any) => Promise<void>) => {
  return await prisma.$transaction(async (tx: any) => {
    await callback(tx);
    // Transaction will rollback after test
    throw new Error('Rollback test transaction');
  }).catch((error: Error) => {
    if (error.message !== 'Rollback test transaction') {
      throw error;
    }
  });
};

/**
 * Assert that a function throws a specific error
 */
export const assertThrows = async (fn: () => Promise<any>, expectedMessage?: string) => {
  try {
    await fn();
    throw new Error('Expected function to throw but it did not');
  } catch (error) {
    if (error instanceof Error && expectedMessage) {
      if (!error.message.includes(expectedMessage)) {
        throw new Error(`Expected error message to include "${expectedMessage}" but got "${error.message}"`);
      }
    }
  }
};

/**
 * Mock Prisma Client for testing
 */
export const createMockPrisma = () => {
  return {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
      user: {
        create: jest.fn(),
        update: jest.fn(),
      },
      company: {
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    })),
    $queryRaw: jest.fn(),
  };
};

/**
 * Type guard for jest mock functions
 */
export const isMockFunction = (fn: any): fn is jest.Mock => {
  return typeof fn === 'function' && 'mock' in fn;
};
