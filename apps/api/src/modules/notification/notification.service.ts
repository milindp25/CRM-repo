import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { NotificationType } from '@hrplatform/shared';
import { LoggerService } from '../../common/services/logger.service';
import { EmailService } from '../../common/services/email.service';
import {
  LEAVE_APPROVED,
  LEAVE_REJECTED,
  LEAVE_APPLIED,
  INVITATION_SENT,
  USER_REGISTERED,
} from '../../common/events/events';
import type {
  LeaveApprovedEvent,
  LeaveRejectedEvent,
  LeaveAppliedEvent,
  InvitationSentEvent,
  UserRegisteredEvent,
} from '../../common/events/events';
import { NotificationRepository } from './notification.repository';
import {
  NotificationFilterDto,
  NotificationResponseDto,
  NotificationPaginationResponseDto,
  UnreadCountResponseDto,
} from './dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository,
    private readonly emailService: EmailService,
    private readonly logger: LoggerService,
  ) {}

  // ============================================================================
  // Public API Methods
  // ============================================================================

  async createNotification(
    companyId: string,
    userId: string,
    data: {
      type: NotificationType;
      title: string;
      message: string;
      resourceType?: string;
      resourceId?: string;
      actionUrl?: string;
    },
  ): Promise<NotificationResponseDto> {
    this.logger.log(
      `Creating notification for user ${userId}: ${data.type}`,
      'NotificationService',
    );

    const createData: Prisma.NotificationCreateInput = {
      type: data.type,
      title: data.title,
      message: data.message,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      actionUrl: data.actionUrl,
      company: { connect: { id: companyId } },
      user: { connect: { id: userId } },
    };

    const notification = await this.repository.create(createData);
    return this.formatNotification(notification);
  }

  async getUserNotifications(
    userId: string,
    companyId: string,
    filter: NotificationFilterDto,
  ): Promise<NotificationPaginationResponseDto> {
    this.logger.log(
      `Fetching notifications for user ${userId}`,
      'NotificationService',
    );

    const { data, total } = await this.repository.findByUser(
      userId,
      companyId,
      filter,
    );

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((n: any) => this.formatNotification(n)),
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async markAsRead(
    id: string,
    userId: string,
    companyId: string,
  ): Promise<void> {
    this.logger.log(
      `Marking notification ${id} as read for user ${userId}`,
      'NotificationService',
    );

    // Verify the notification belongs to this user and company
    const notification = await this.repository.findById(id, companyId);
    if (!notification || notification.userId !== userId) {
      return;
    }

    await this.repository.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string, companyId: string): Promise<void> {
    this.logger.log(
      `Marking all notifications as read for user ${userId}`,
      'NotificationService',
    );

    await this.repository.markAllAsRead(userId, companyId);
  }

  async getUnreadCount(
    userId: string,
    companyId: string,
  ): Promise<UnreadCountResponseDto> {
    const count = await this.repository.getUnreadCount(userId, companyId);
    return { count };
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  @OnEvent(LEAVE_APPROVED)
  async handleLeaveApproved(payload: LeaveApprovedEvent): Promise<void> {
    this.logger.log(
      `Handling leave approved event for employee ${payload.employeeId}`,
      'NotificationService',
    );

    try {
      // Create in-app notification for the employee
      const notification = await this.createNotification(
        payload.companyId,
        payload.employeeId,
        {
          type: NotificationType.LEAVE_APPROVED,
          title: 'Leave Request Approved',
          message: `Your ${payload.leaveType} leave request from ${payload.startDate} to ${payload.endDate} (${payload.totalDays} day${payload.totalDays > 1 ? 's' : ''}) has been approved${payload.approverName ? ` by ${payload.approverName}` : ''}.`,
          resourceType: 'LEAVE',
          resourceId: payload.leaveId,
          actionUrl: `/leaves/${payload.leaveId}`,
        },
      );

      // Send email notification
      if (payload.employeeEmail) {
        const emailSent = await this.emailService.sendTemplatedMail(
          payload.employeeEmail,
          'leave-approved',
          {
            recipientName: payload.employeeName,
            leaveType: payload.leaveType,
            startDate: payload.startDate,
            endDate: payload.endDate,
            totalDays: payload.totalDays,
            approverName: payload.approverName,
          },
        );

        if (emailSent) {
          await this.repository.updateEmailSent(notification.id);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle leave approved event: ${(error as Error).message}`,
        (error as Error).stack,
        'NotificationService',
      );
    }
  }

  @OnEvent(LEAVE_REJECTED)
  async handleLeaveRejected(payload: LeaveRejectedEvent): Promise<void> {
    this.logger.log(
      `Handling leave rejected event for employee ${payload.employeeId}`,
      'NotificationService',
    );

    try {
      // Create in-app notification for the employee
      const notification = await this.createNotification(
        payload.companyId,
        payload.employeeId,
        {
          type: NotificationType.LEAVE_REJECTED,
          title: 'Leave Request Rejected',
          message: `Your ${payload.leaveType} leave request from ${payload.startDate} to ${payload.endDate} has been rejected${payload.approverName ? ` by ${payload.approverName}` : ''}.${payload.rejectionReason ? ` Reason: ${payload.rejectionReason}` : ''}`,
          resourceType: 'LEAVE',
          resourceId: payload.leaveId,
          actionUrl: `/leaves/${payload.leaveId}`,
        },
      );

      // Send email notification
      if (payload.employeeEmail) {
        const emailSent = await this.emailService.sendTemplatedMail(
          payload.employeeEmail,
          'leave-rejected',
          {
            recipientName: payload.employeeName,
            leaveType: payload.leaveType,
            startDate: payload.startDate,
            endDate: payload.endDate,
            rejectionReason: payload.rejectionReason,
            approverName: payload.approverName,
          },
        );

        if (emailSent) {
          await this.repository.updateEmailSent(notification.id);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle leave rejected event: ${(error as Error).message}`,
        (error as Error).stack,
        'NotificationService',
      );
    }
  }

  @OnEvent(LEAVE_APPLIED)
  async handleLeaveApplied(payload: LeaveAppliedEvent): Promise<void> {
    this.logger.log(
      `Handling leave applied event for employee ${payload.employeeId}`,
      'NotificationService',
    );

    try {
      // Create in-app notification for each approver
      for (const approverId of payload.approverIds) {
        await this.createNotification(payload.companyId, approverId, {
          type: NotificationType.LEAVE_APPLIED,
          title: 'New Leave Request',
          message: `${payload.employeeName} has applied for ${payload.leaveType} leave from ${payload.startDate} to ${payload.endDate} (${payload.totalDays} day${payload.totalDays > 1 ? 's' : ''}).${payload.reason ? ` Reason: ${payload.reason}` : ''}`,
          resourceType: 'LEAVE',
          resourceId: payload.leaveId,
          actionUrl: `/leaves/${payload.leaveId}`,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle leave applied event: ${(error as Error).message}`,
        (error as Error).stack,
        'NotificationService',
      );
    }
  }

  @OnEvent(INVITATION_SENT)
  async handleInvitationSent(payload: InvitationSentEvent): Promise<void> {
    this.logger.log(
      `Handling invitation sent event for ${payload.inviteeEmail}`,
      'NotificationService',
    );

    try {
      // Send invitation email
      const emailSent = await this.emailService.sendTemplatedMail(
        payload.inviteeEmail,
        'invitation',
        {
          recipientName: payload.inviteeName,
          companyName: payload.companyName,
          inviterName: payload.inviterName,
          role: payload.role,
          invitationUrl: payload.invitationUrl,
        },
      );

      // Create in-app notification for the inviter as a confirmation
      const notification = await this.createNotification(
        payload.companyId,
        payload.inviterId,
        {
          type: NotificationType.INVITATION_RECEIVED,
          title: 'Invitation Sent',
          message: `Invitation has been sent to ${payload.inviteeEmail} to join as ${payload.role}.`,
          resourceType: 'INVITATION',
        },
      );

      if (emailSent) {
        await this.repository.updateEmailSent(notification.id);
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle invitation sent event: ${(error as Error).message}`,
        (error as Error).stack,
        'NotificationService',
      );
    }
  }

  @OnEvent(USER_REGISTERED)
  async handleUserRegistered(payload: UserRegisteredEvent): Promise<void> {
    this.logger.log(
      `Handling user registered event for user ${payload.userId}`,
      'NotificationService',
    );

    try {
      // Create welcome in-app notification
      const notification = await this.createNotification(
        payload.companyId,
        payload.userId,
        {
          type: NotificationType.WELCOME,
          title: `Welcome to ${payload.companyName}!`,
          message: `Welcome aboard, ${payload.userName}! Your account has been set up successfully. Explore your dashboard to get started.`,
          actionUrl: '/dashboard',
        },
      );

      // Send welcome email
      if (payload.userEmail) {
        const emailSent = await this.emailService.sendTemplatedMail(
          payload.userEmail,
          'welcome',
          {
            recipientName: payload.userName,
            companyName: payload.companyName,
            loginUrl: payload.loginUrl,
          },
        );

        if (emailSent) {
          await this.repository.updateEmailSent(notification.id);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle user registered event: ${(error as Error).message}`,
        (error as Error).stack,
        'NotificationService',
      );
    }
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private formatNotification(notification: any): NotificationResponseDto {
    return {
      id: notification.id,
      companyId: notification.companyId,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      resourceType: notification.resourceType,
      resourceId: notification.resourceId,
      actionUrl: notification.actionUrl,
      isRead: notification.isRead,
      readAt: notification.readAt,
      emailSent: notification.emailSent,
      emailSentAt: notification.emailSentAt,
      createdAt: notification.createdAt,
    };
  }
}
