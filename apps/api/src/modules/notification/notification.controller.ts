import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { NotificationService } from './notification.service';
import {
  NotificationFilterDto,
  NotificationPaginationResponseDto,
  UnreadCountResponseDto,
} from './dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: '1' })
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    type: NotificationPaginationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotifications(
    @CurrentUser('userId') userId: string,
    @CompanyId() companyId: string,
    @Query() filter: NotificationFilterDto,
  ): Promise<NotificationPaginationResponseDto> {
    return this.notificationService.getUserNotifications(
      userId,
      companyId,
      filter,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
    type: UnreadCountResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(
    @CurrentUser('userId') userId: string,
    @CompanyId() companyId: string,
  ): Promise<UnreadCountResponseDto> {
    return this.notificationService.getUnreadCount(userId, companyId);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 204,
    description: 'All notifications marked as read',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(
    @CurrentUser('userId') userId: string,
    @CompanyId() companyId: string,
  ): Promise<void> {
    await this.notificationService.markAllAsRead(userId, companyId);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 204, description: 'Notification marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsRead(
    @CurrentUser('userId') userId: string,
    @CompanyId() companyId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.notificationService.markAsRead(id, userId, companyId);
  }
}
