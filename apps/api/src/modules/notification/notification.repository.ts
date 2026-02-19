import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { NotificationFilterDto } from './dto';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.NotificationCreateInput) {
    return this.prisma.notification.create({
      data,
    });
  }

  async findByUser(
    userId: string,
    companyId: string,
    options: NotificationFilterDto,
  ) {
    const { page = 1, limit = 20, unreadOnly = false } = options;

    const where: Prisma.NotificationWhereInput = {
      userId,
      companyId,
      ...(unreadOnly && { isRead: false }),
    };

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string, companyId: string) {
    return this.prisma.notification.findFirst({
      where: {
        id,
        companyId,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string, companyId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        companyId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async getUnreadCount(userId: string, companyId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        companyId,
        isRead: false,
      },
    });
  }

  async deleteOld(companyId: string, olderThan: Date) {
    return this.prisma.notification.deleteMany({
      where: {
        companyId,
        createdAt: {
          lt: olderThan,
        },
      },
    });
  }

  async updateEmailSent(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
      },
    });
  }
}
