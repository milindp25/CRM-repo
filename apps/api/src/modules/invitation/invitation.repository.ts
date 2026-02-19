import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { InvitationFilterDto } from './dto';

/**
 * Invitation Repository
 * Data access layer for invitation operations
 */
@Injectable()
export class InvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new invitation
   */
  async create(data: Prisma.InvitationCreateInput) {
    return this.prisma.invitation.create({
      data,
      include: {
        inviter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });
  }

  /**
   * Find invitation by token (for acceptance and verification)
   */
  async findByToken(token: string) {
    return this.prisma.invitation.findUnique({
      where: { token },
      include: {
        inviter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
    });
  }

  /**
   * Find invitation by ID within a company
   */
  async findById(id: string, companyId: string) {
    return this.prisma.invitation.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        inviter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find pending invitation for email within a company
   */
  async findByEmail(email: string, companyId: string) {
    return this.prisma.invitation.findFirst({
      where: {
        email,
        companyId,
        status: 'PENDING',
      },
    });
  }

  /**
   * Find many invitations with filters and pagination
   */
  async findMany(companyId: string, filter: InvitationFilterDto) {
    const { search, status, page = 1, limit = 20 } = filter;

    const where: Prisma.InvitationWhereInput = {
      companyId,
      ...(status && { status }),
      ...(search && {
        email: { contains: search, mode: 'insensitive' },
      }),
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.invitation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          inviter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.invitation.count({ where }),
    ]);

    return {
      data,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Update an invitation
   */
  async update(id: string, data: Prisma.InvitationUpdateInput) {
    return this.prisma.invitation.update({
      where: { id },
      data,
      include: {
        inviter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Count pending invitations for a company
   */
  async countPending(companyId: string): Promise<number> {
    return this.prisma.invitation.count({
      where: {
        companyId,
        status: 'PENDING',
      },
    });
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(data: {
    userId: string;
    userEmail: string;
    action: string;
    resourceType: string;
    resourceId: string;
    companyId: string;
    success: boolean;
    metadata?: any;
  }) {
    return this.prisma.auditLog.create({ data });
  }
}
