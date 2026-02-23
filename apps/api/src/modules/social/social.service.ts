import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LoggerService } from '../../common/services/logger.service';
import {
  SocialRepository,
  DirectoryFilterParams,
} from './social.repository';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  SendKudosDto,
} from './dto';

@Injectable()
export class SocialService {
  constructor(
    private readonly repository: SocialRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
  ) {}

  // ─── Directory ────────────────────────────────────────────────────────

  async searchDirectory(
    companyId: string,
    filter: DirectoryFilterParams,
  ) {
    this.logger.log('Searching employee directory', 'SocialService');

    const { data, total } = await this.repository.findEmployees(companyId, filter);

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
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

  async getBirthdays(companyId: string) {
    this.logger.log('Fetching today\'s birthdays', 'SocialService');
    return this.repository.findBirthdays(companyId);
  }

  async getAnniversaries(companyId: string) {
    this.logger.log('Fetching today\'s work anniversaries', 'SocialService');
    return this.repository.findAnniversaries(companyId);
  }

  // ─── Announcements ───────────────────────────────────────────────────

  async createAnnouncement(
    companyId: string,
    userId: string,
    dto: CreateAnnouncementDto,
  ) {
    this.logger.log(
      `Creating announcement "${dto.title}" for company ${companyId}`,
      'SocialService',
    );

    const announcement = await this.repository.createAnnouncement({
      title: dto.title,
      content: dto.content,
      priority: dto.priority || 'NORMAL',
      isPinned: dto.isPinned ?? false,
      isActive: true,
      publishedAt: new Date(),
      ...(dto.expiresAt && { expiresAt: new Date(dto.expiresAt) }),
      company: { connect: { id: companyId } },
      author: { connect: { id: userId } },
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'ANNOUNCEMENT',
      resourceId: announcement.id,
      newValues: {
        title: dto.title,
        priority: dto.priority || 'NORMAL',
        isPinned: dto.isPinned ?? false,
      },
    });

    this.eventEmitter.emit('announcement.published', {
      companyId,
      announcementId: announcement.id,
      title: dto.title,
      priority: dto.priority || 'NORMAL',
      authorId: userId,
    });

    this.logger.log(
      `Announcement "${dto.title}" created successfully (id: ${announcement.id})`,
      'SocialService',
    );

    return announcement;
  }

  async findAnnouncements(
    companyId: string,
    page?: number,
    limit?: number,
  ) {
    this.logger.log('Listing announcements', 'SocialService');

    const { data, total } = await this.repository.findAnnouncements(companyId, {
      page,
      limit,
    });

    const currentPage = page || 1;
    const itemsPerPage = limit || 20;
    const totalPages = Math.ceil(total / itemsPerPage);

    return {
      data,
      meta: {
        currentPage,
        itemsPerPage,
        totalItems: total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    };
  }

  async findAnnouncementById(id: string, companyId: string) {
    this.logger.log(`Finding announcement ${id}`, 'SocialService');

    const announcement = await this.repository.findAnnouncementById(id, companyId);

    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }

    return announcement;
  }

  async updateAnnouncement(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateAnnouncementDto,
  ) {
    this.logger.log(`Updating announcement ${id}`, 'SocialService');

    const existing = await this.repository.findAnnouncementById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Announcement not found');
    }

    const updateData: Record<string, any> = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.isPinned !== undefined) updateData.isPinned = dto.isPinned;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.expiresAt !== undefined) updateData.expiresAt = new Date(dto.expiresAt);

    const updated = await this.repository.updateAnnouncement(id, companyId, updateData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'ANNOUNCEMENT',
      resourceId: id,
      oldValues: {
        title: existing.title,
        priority: existing.priority,
        isPinned: existing.isPinned,
      },
      newValues: dto,
    });

    return updated;
  }

  async deleteAnnouncement(
    id: string,
    companyId: string,
    userId: string,
  ) {
    this.logger.log(`Deactivating announcement ${id}`, 'SocialService');

    const existing = await this.repository.findAnnouncementById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Announcement not found');
    }

    await this.repository.deleteAnnouncement(id, companyId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'ANNOUNCEMENT',
      resourceId: id,
      oldValues: {
        title: existing.title,
        priority: existing.priority,
      },
    });

    this.logger.log(`Announcement ${id} deactivated`, 'SocialService');
  }

  // ─── Kudos ────────────────────────────────────────────────────────────

  async sendKudos(
    companyId: string,
    senderId: string,
    dto: SendKudosDto,
  ) {
    this.logger.log(
      `Sending kudos from ${senderId} to employee ${dto.recipientEmployeeId}`,
      'SocialService',
    );

    if (senderId === dto.recipientEmployeeId) {
      throw new BadRequestException('You cannot send kudos to yourself');
    }

    const kudos = await this.repository.createKudos({
      message: dto.message,
      category: dto.category,
      isPublic: dto.isPublic ?? true,
      company: { connect: { id: companyId } },
      sender: { connect: { id: senderId } },
      recipient: { connect: { id: dto.recipientEmployeeId } },
    });

    await this.repository.createAuditLog({
      userId: senderId,
      companyId,
      action: 'CREATE',
      resourceType: 'KUDOS',
      resourceId: kudos.id,
      newValues: {
        recipientEmployeeId: dto.recipientEmployeeId,
        category: dto.category,
        isPublic: dto.isPublic ?? true,
      },
    });

    this.eventEmitter.emit('kudos.sent', {
      companyId,
      kudosId: kudos.id,
      senderId,
      recipientEmployeeId: dto.recipientEmployeeId,
      category: dto.category,
      message: dto.message,
    });

    this.logger.log(
      `Kudos sent successfully (id: ${kudos.id})`,
      'SocialService',
    );

    return kudos;
  }

  async getKudos(companyId: string, page?: number, limit?: number) {
    this.logger.log('Listing public kudos', 'SocialService');

    const { data, total } = await this.repository.findKudos(companyId, {
      page,
      limit,
    });

    const currentPage = page || 1;
    const itemsPerPage = limit || 20;
    const totalPages = Math.ceil(total / itemsPerPage);

    return {
      data,
      meta: {
        currentPage,
        itemsPerPage,
        totalItems: total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    };
  }

  async getMyKudos(
    companyId: string,
    employeeId: string,
    page?: number,
    limit?: number,
  ) {
    this.logger.log(
      `Listing kudos received by employee ${employeeId}`,
      'SocialService',
    );

    const { data, total } = await this.repository.findKudosByRecipient(
      employeeId,
      { page, limit },
    );

    const currentPage = page || 1;
    const itemsPerPage = limit || 20;
    const totalPages = Math.ceil(total / itemsPerPage);

    return {
      data,
      meta: {
        currentPage,
        itemsPerPage,
        totalItems: total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    };
  }

  async getLeaderboard(companyId: string) {
    this.logger.log('Fetching kudos leaderboard', 'SocialService');
    return this.repository.findKudosLeaderboard(companyId);
  }
}
