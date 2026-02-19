import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ApiKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new API key record.
   */
  async create(data: Prisma.ApiKeyCreateInput) {
    return this.prisma.apiKey.create({
      data,
      select: {
        id: true,
        companyId: true,
        name: true,
        description: true,
        prefix: true,
        permissions: true,
        rateLimit: true,
        expiresAt: true,
        lastUsedAt: true,
        createdBy: true,
        isActive: true,
        revokedAt: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * List all API keys for a company with pagination.
   * Never returns keyHash.
   */
  async findAllByCompany(companyId: string, page: number, limit: number) {
    const where: Prisma.ApiKeyWhereInput = { companyId };

    const [data, total] = await Promise.all([
      this.prisma.apiKey.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          companyId: true,
          name: true,
          description: true,
          prefix: true,
          permissions: true,
          rateLimit: true,
          expiresAt: true,
          lastUsedAt: true,
          createdBy: true,
          isActive: true,
          revokedAt: true,
          createdAt: true,
          updatedAt: true,
          creator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.apiKey.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Find a single API key by ID and companyId.
   * Never returns keyHash.
   */
  async findById(id: string, companyId: string) {
    return this.prisma.apiKey.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        companyId: true,
        name: true,
        description: true,
        prefix: true,
        permissions: true,
        rateLimit: true,
        expiresAt: true,
        lastUsedAt: true,
        createdBy: true,
        isActive: true,
        revokedAt: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Find API key by its hashed key value (for authentication lookup).
   * Returns full record including companyId, permissions, etc.
   */
  async findByKeyHash(keyHash: string) {
    return this.prisma.apiKey.findFirst({
      where: { keyHash },
      select: {
        id: true,
        companyId: true,
        name: true,
        permissions: true,
        rateLimit: true,
        expiresAt: true,
        lastUsedAt: true,
        createdBy: true,
        isActive: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Update the lastUsedAt timestamp for an API key.
   */
  async updateLastUsed(id: string) {
    return this.prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * Revoke an API key (soft deactivate).
   */
  async revoke(id: string, companyId: string) {
    return this.prisma.apiKey.update({
      where: { id, companyId },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
      select: {
        id: true,
        companyId: true,
        name: true,
        description: true,
        prefix: true,
        permissions: true,
        rateLimit: true,
        expiresAt: true,
        lastUsedAt: true,
        createdBy: true,
        isActive: true,
        revokedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Hard delete an API key.
   */
  async delete(id: string, companyId: string) {
    return this.prisma.apiKey.delete({
      where: { id, companyId },
    });
  }

  /**
   * Count API keys for a company (for pagination metadata).
   */
  async countByCompany(companyId: string) {
    return this.prisma.apiKey.count({
      where: { companyId },
    });
  }

  /**
   * Create an audit log entry for API key operations.
   */
  async createAuditLog(data: {
    userId: string;
    companyId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
  }) {
    return this.prisma.auditLog.create({
      data,
    });
  }
}
