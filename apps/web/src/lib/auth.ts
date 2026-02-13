import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { generateAccessToken, generateRefreshToken } from './jwt';
import {
  AuthenticationError,
  ValidationError,
  ConflictError
} from './errors';
import logger from './logger';

export async function registerUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}) {
  // Check if user exists (email is not unique by itself, so use findFirst)
  const existingUser = await prisma.user.findFirst({
    where: { email: data.email }
  });

  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Create company and admin user in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create company
    const company = await tx.company.create({
      data: {
        companyName: data.companyName,
        companyCode: generateCompanyCode(data.companyName),
        subscriptionTier: 'FREE',
        subscriptionStatus: 'TRIAL',
        isActive: true
      }
    });

    // Create admin user
    const user = await tx.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        companyId: company.id,
        role: 'COMPANY_ADMIN',
        permissions: ['ALL'],
        isActive: true,
        emailVerified: false
      }
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        action: 'USER_REGISTERED',
        resourceType: 'USER',
        resourceId: user.id,
        companyId: company.id,
        success: true
      }
    });

    return { user, company };
  });

  logger.info(`User registered: ${data.email}, Company: ${data.companyName}`);

  return result;
}

export async function loginUser(email: string, password: string) {
  // Find user with company (email is not unique by itself, so use findFirst)
  const user = await prisma.user.findFirst({
    where: { email },
    include: { company: true }
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Check if password hash exists
  if (!user.passwordHash) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AuthenticationError('Account is inactive');
  }

  // Check if company is active
  if (!user.company?.isActive) {
    throw new AuthenticationError('Company account is suspended');
  }

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    companyId: user.companyId!,
    role: user.role,
    permissions: user.permissions as string[]
  });

  const refreshToken = generateRefreshToken(user.id);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userEmail: user.email,
      action: 'USER_LOGIN',
      resourceType: 'USER',
      resourceId: user.id,
      companyId: user.companyId,
      success: true
    }
  });

  logger.info(`User logged in: ${email}`);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      companyId: user.companyId
    },
    accessToken,
    refreshToken
  };
}

function generateCompanyCode(companyName: string): string {
  const prefix = companyName
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .substring(0, 3);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${random}`;
}
