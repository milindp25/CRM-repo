import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Auth Repository (Data Access Layer)
 * Single Responsibility: Only handles database operations
 */
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email },
      include: { company: true },
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { company: true },
    });
  }

  async createUserWithCompany(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    companyName: string;
    companyCode: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          companyName: data.companyName,
          companyCode: data.companyCode,
          subscriptionTier: 'FREE',
          subscriptionStatus: 'TRIAL',
          isActive: true,
        },
      });

      // Create admin user
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          companyId: company.id,
          role: 'COMPANY_ADMIN',
          permissions: ['ALL'],
          isActive: true,
          emailVerified: false,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          action: 'USER_REGISTERED',
          resourceType: 'USER',
          resourceId: user.id,
          companyId: company.id,
          success: true,
        },
      });

      return { user, company };
    });
  }

  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true },
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async createAuditLog(data: {
    userId: string;
    userEmail: string;
    action: string;
    resourceType: string;
    resourceId: string;
    companyId: string;
    success: boolean;
  }) {
    return this.prisma.auditLog.create({ data });
  }

  // ============================================================================
  // SSO / Google OAuth Methods
  // ============================================================================

  /**
   * Find a user by their Google ID
   */
  async findUserByGoogleId(googleId: string) {
    return this.prisma.user.findUnique({
      where: { googleId },
      include: { company: true },
    });
  }

  /**
   * Create a new user from Google OAuth profile
   */
  async createGoogleUser(data: {
    email: string;
    googleId: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    companyId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          googleId: data.googleId,
          firstName: data.firstName,
          lastName: data.lastName,
          avatar: data.avatar || null,
          companyId: data.companyId,
          role: 'EMPLOYEE',
          permissions: [],
          isActive: true,
          emailVerified: true,
          lastLoginAt: new Date(),
        },
        include: { company: true },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          action: 'USER_SSO_REGISTERED',
          resourceType: 'USER',
          resourceId: user.id,
          companyId: data.companyId,
          success: true,
        },
      });

      return user;
    });
  }

  /**
   * Link a Google account to an existing user
   */
  async updateGoogleId(userId: string, googleId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        googleId,
        emailVerified: true,
        lastLoginAt: new Date(),
      },
      include: { company: true },
    });
  }

  /**
   * Get the SSO configuration for a company
   */
  async getSSOConfig(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { ssoConfig: true },
    });
    return company?.ssoConfig;
  }

  /**
   * Update the SSO configuration for a company
   */
  async updateSSOConfig(companyId: string, config: Record<string, any>) {
    return this.prisma.company.update({
      where: { id: companyId },
      data: { ssoConfig: config },
      select: { id: true, ssoConfig: true },
    });
  }
}
