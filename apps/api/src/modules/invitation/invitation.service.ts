import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  GoneException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { InvitationRepository } from './invitation.repository';
import {
  CreateInvitationDto,
  AcceptInvitationDto,
  InvitationFilterDto,
  InvitationResponseDto,
  InvitationPaginationResponseDto,
  InvitationVerifyResponseDto,
  AcceptInvitationResponseDto,
} from './dto';
import { LoggerService } from '../../common/services/logger.service';
import { PrismaService } from '../../database/prisma.service';
import {
  InvitationStatus,
  UserRole,
  TIER_LIMITS,
  SubscriptionTier,
  RolePermissions,
} from '@hrplatform/shared';

/**
 * Invitation Service
 * Business logic for invitation management
 */
@Injectable()
export class InvitationService {
  constructor(
    private readonly repository: InvitationRepository,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Send a new invitation
   */
  async invite(
    companyId: string,
    userId: string,
    dto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    this.logger.log(
      `Sending invitation to ${dto.email} for role ${dto.role}`,
      'InvitationService',
    );

    // Prevent inviting SUPER_ADMIN role
    if (dto.role === UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Cannot invite users with SUPER_ADMIN role');
    }

    // Check if user with this email already exists in the company
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        companyId,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'A user with this email already exists in your company',
      );
    }

    // Check if a pending invitation already exists for this email in the company
    const existingInvitation = await this.repository.findByEmail(
      dto.email,
      companyId,
    );

    if (existingInvitation) {
      throw new ConflictException(
        'A pending invitation already exists for this email address',
      );
    }

    // Check subscription limits (user count)
    await this.checkUserLimit(companyId);

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiry to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation record
    const invitation = await this.repository.create({
      email: dto.email,
      role: dto.role,
      token,
      status: InvitationStatus.PENDING,
      expiresAt,
      company: { connect: { id: companyId } },
      inviter: { connect: { id: userId } },
    });

    this.logger.log(
      `Invitation created: ${invitation.id} for ${dto.email}`,
      'InvitationService',
    );

    // Emit invitation.sent event
    this.eventEmitter.emit('invitation.sent', {
      email: dto.email,
      token,
      companyName: invitation.company?.companyName,
      role: dto.role,
      inviterName: invitation.inviter
        ? `${invitation.inviter.firstName} ${invitation.inviter.lastName}`
        : undefined,
    });

    // Create audit log (fire and forget)
    this.repository.createAuditLog({
      userId,
      userEmail: invitation.inviter?.email ?? 'system',
      action: 'INVITATION_SENT',
      resourceType: 'INVITATION',
      resourceId: invitation.id,
      companyId,
      success: true,
      metadata: { email: dto.email, role: dto.role },
    });

    return this.formatInvitation(invitation);
  }

  /**
   * List invitations with pagination
   */
  async findAll(
    companyId: string,
    filter: InvitationFilterDto,
  ): Promise<InvitationPaginationResponseDto> {
    const result = await this.repository.findMany(companyId, filter);

    return {
      data: result.data.map((inv) => this.formatInvitation(inv)),
      meta: result.meta,
    };
  }

  /**
   * Get single invitation by ID
   */
  async findOne(id: string, companyId: string): Promise<InvitationResponseDto> {
    const invitation = await this.repository.findById(id, companyId);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return this.formatInvitation(invitation);
  }

  /**
   * Revoke an invitation
   */
  async revoke(
    id: string,
    companyId: string,
    userId: string,
  ): Promise<InvitationResponseDto> {
    this.logger.log(`Revoking invitation: ${id}`, 'InvitationService');

    const invitation = await this.repository.findById(id, companyId);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        `Cannot revoke invitation with status: ${invitation.status}`,
      );
    }

    const updated = await this.repository.update(id, {
      status: InvitationStatus.REVOKED,
    });

    this.logger.log(`Invitation revoked: ${id}`, 'InvitationService');

    // Create audit log (fire and forget)
    this.repository.createAuditLog({
      userId,
      userEmail: 'system',
      action: 'INVITATION_REVOKED',
      resourceType: 'INVITATION',
      resourceId: id,
      companyId,
      success: true,
      metadata: { email: invitation.email },
    });

    return this.formatInvitation(updated);
  }

  /**
   * Resend an invitation (generate new token, reset expiry)
   */
  async resend(
    id: string,
    companyId: string,
    userId: string,
  ): Promise<InvitationResponseDto> {
    this.logger.log(`Resending invitation: ${id}`, 'InvitationService');

    const invitation = await this.repository.findById(id, companyId);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (
      invitation.status !== InvitationStatus.PENDING &&
      invitation.status !== InvitationStatus.EXPIRED
    ) {
      throw new BadRequestException(
        `Cannot resend invitation with status: ${invitation.status}`,
      );
    }

    // Generate new token and reset expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const updated = await this.repository.update(id, {
      token,
      expiresAt,
      status: InvitationStatus.PENDING,
    });

    this.logger.log(
      `Invitation resent: ${id} for ${invitation.email}`,
      'InvitationService',
    );

    // Emit invitation.sent event for the resend
    this.eventEmitter.emit('invitation.sent', {
      email: invitation.email,
      token,
      companyName: undefined, // Not included in findById
      role: invitation.role,
      inviterName: invitation.inviter
        ? `${invitation.inviter.firstName} ${invitation.inviter.lastName}`
        : undefined,
    });

    // Create audit log (fire and forget)
    this.repository.createAuditLog({
      userId,
      userEmail: 'system',
      action: 'INVITATION_RESENT',
      resourceType: 'INVITATION',
      resourceId: id,
      companyId,
      success: true,
      metadata: { email: invitation.email },
    });

    return this.formatInvitation(updated);
  }

  /**
   * Verify an invitation token (public endpoint)
   */
  async verifyToken(token: string): Promise<InvitationVerifyResponseDto> {
    const invitation = await this.repository.findByToken(token);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const isExpired = new Date() > new Date(invitation.expiresAt);
    const isValid =
      invitation.status === InvitationStatus.PENDING && !isExpired;

    return {
      email: invitation.email,
      role: invitation.role,
      companyName: invitation.company?.companyName ?? '',
      expiresAt: invitation.expiresAt,
      valid: isValid,
    };
  }

  /**
   * Accept an invitation (creates user account)
   */
  async acceptInvitation(
    dto: AcceptInvitationDto,
  ): Promise<AcceptInvitationResponseDto> {
    this.logger.log('Processing invitation acceptance', 'InvitationService');

    // Find invitation by token
    const invitation = await this.repository.findByToken(dto.token);

    if (!invitation) {
      throw new NotFoundException('Invitation not found or invalid token');
    }

    // Check if already accepted
    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new BadRequestException('This invitation has already been accepted');
    }

    // Check if revoked
    if (invitation.status === InvitationStatus.REVOKED) {
      throw new GoneException('This invitation has been revoked');
    }

    // Check if expired
    const isExpired = new Date() > new Date(invitation.expiresAt);
    if (isExpired || invitation.status === InvitationStatus.EXPIRED) {
      throw new GoneException('This invitation has expired');
    }

    // Check if user with this email already exists in the company
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: invitation.email,
        companyId: invitation.companyId,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'A user with this email already exists in this company',
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Get default permissions for the role
    const role = invitation.role as UserRole;
    const permissions = RolePermissions[role]?.map((p) => p.toString()) ?? [];

    // Use a transaction to create user and update invitation atomically
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user account
      const user = await tx.user.create({
        data: {
          email: invitation.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          companyId: invitation.companyId,
          role: invitation.role,
          permissions,
          isActive: true,
          emailVerified: true,
        },
      });

      // Update invitation status to ACCEPTED
      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.ACCEPTED,
          acceptedAt: new Date(),
          acceptedUserId: user.id,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          userEmail: user.email,
          action: 'INVITATION_ACCEPTED',
          resourceType: 'INVITATION',
          resourceId: invitation.id,
          companyId: invitation.companyId,
          success: true,
          metadata: {
            role: invitation.role,
            invitedBy: invitation.invitedBy,
          },
        },
      });

      return user;
    });

    this.logger.log(
      `Invitation accepted: ${invitation.id}, user created: ${result.id}`,
      'InvitationService',
    );

    // Emit invitation.accepted event
    this.eventEmitter.emit('invitation.accepted', {
      email: invitation.email,
      userId: result.id,
      companyId: invitation.companyId,
      role: invitation.role,
    });

    return {
      message: 'Invitation accepted successfully. You can now log in.',
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
      },
    };
  }

  /**
   * Check if the company has reached its user limit
   */
  private async checkUserLimit(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { subscriptionTier: true },
    });

    if (!company) return;

    const tier = company.subscriptionTier as SubscriptionTier;
    const limits = TIER_LIMITS[tier] ?? TIER_LIMITS[SubscriptionTier.FREE];

    if (limits.maxUsers === Infinity) return;

    // Count current users + pending invitations
    const [userCount, pendingInvitations] = await Promise.all([
      this.prisma.user.count({
        where: { companyId, isActive: true },
      }),
      this.repository.countPending(companyId),
    ]);

    const totalProjected = userCount + pendingInvitations;

    if (totalProjected >= limits.maxUsers) {
      throw new ForbiddenException(
        `User limit reached (${limits.maxUsers} for ${tier} plan). Please upgrade your subscription to invite more users.`,
      );
    }
  }

  /**
   * Format invitation for response
   */
  private formatInvitation(invitation: any): InvitationResponseDto {
    return {
      id: invitation.id,
      companyId: invitation.companyId,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      invitedBy: invitation.invitedBy,
      inviter: invitation.inviter
        ? {
            id: invitation.inviter.id,
            firstName: invitation.inviter.firstName,
            lastName: invitation.inviter.lastName,
            email: invitation.inviter.email,
          }
        : undefined,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      acceptedUserId: invitation.acceptedUserId,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    };
  }
}
