import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permission, UserRole } from '@hrplatform/shared';
import { SocialService } from './social.service';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  SendKudosDto,
} from './dto';

// TS1272 workaround: define JwtPayload locally instead of importing
interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}

@ApiTags('Social')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'social', version: '1' })
@RequireFeature('DIRECTORY')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  // ─── Directory ────────────────────────────────────────────────────────

  @Get('directory')
  @RequirePermissions(Permission.VIEW_DIRECTORY)
  @ApiOperation({ summary: 'Search employee directory' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, email, or employee code' })
  @ApiQuery({ name: 'departmentId', required: false, description: 'Filter by department ID' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({ status: 200, description: 'Directory results retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async searchDirectory(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.searchDirectory(user.companyId, {
      search,
      departmentId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('directory/birthdays')
  @RequirePermissions(Permission.VIEW_DIRECTORY)
  @ApiOperation({ summary: 'Get today\'s birthdays' })
  @ApiResponse({ status: 200, description: 'Birthdays retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBirthdays(@CurrentUser() user: JwtPayload) {
    return this.socialService.getBirthdays(user.companyId);
  }

  @Get('directory/anniversaries')
  @RequirePermissions(Permission.VIEW_DIRECTORY)
  @ApiOperation({ summary: 'Get today\'s work anniversaries' })
  @ApiResponse({ status: 200, description: 'Anniversaries retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAnniversaries(@CurrentUser() user: JwtPayload) {
    return this.socialService.getAnniversaries(user.companyId);
  }

  // ─── Announcements ───────────────────────────────────────────────────

  @Post('announcements')
  @RequirePermissions(Permission.MANAGE_ANNOUNCEMENTS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a new announcement' })
  @ApiResponse({ status: 201, description: 'Announcement created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createAnnouncement(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.socialService.createAnnouncement(
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Get('announcements')
  @RequirePermissions(Permission.VIEW_DIRECTORY)
  @ApiOperation({ summary: 'List active announcements' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({ status: 200, description: 'Announcements retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAnnouncements(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.findAnnouncements(
      user.companyId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('announcements/:id')
  @RequirePermissions(Permission.VIEW_DIRECTORY)
  @ApiOperation({ summary: 'Get announcement by ID' })
  @ApiResponse({ status: 200, description: 'Announcement retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async findAnnouncementById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.socialService.findAnnouncementById(id, user.companyId);
  }

  @Patch('announcements/:id')
  @RequirePermissions(Permission.MANAGE_ANNOUNCEMENTS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update an announcement' })
  @ApiResponse({ status: 200, description: 'Announcement updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async updateAnnouncement(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    return this.socialService.updateAnnouncement(
      id,
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Delete('announcements/:id')
  @RequirePermissions(Permission.MANAGE_ANNOUNCEMENTS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Deactivate an announcement' })
  @ApiResponse({ status: 200, description: 'Announcement deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Announcement not found' })
  async deleteAnnouncement(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.socialService.deleteAnnouncement(
      id,
      user.companyId,
      user.userId,
    );
  }

  // ─── Kudos ────────────────────────────────────────────────────────────

  @Post('kudos')
  @RequirePermissions(Permission.SEND_KUDOS)
  @ApiOperation({ summary: 'Send kudos to an employee' })
  @ApiResponse({ status: 201, description: 'Kudos sent successfully' })
  @ApiResponse({ status: 400, description: 'Cannot send kudos to yourself' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendKudos(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendKudosDto,
  ) {
    return this.socialService.sendKudos(
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Get('kudos')
  @RequirePermissions(Permission.VIEW_DIRECTORY)
  @ApiOperation({ summary: 'List public kudos feed' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({ status: 200, description: 'Kudos retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getKudos(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getKudos(
      user.companyId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('kudos/my')
  @RequirePermissions(Permission.SEND_KUDOS, Permission.VIEW_DIRECTORY)
  @ApiOperation({ summary: 'Get kudos received by the current user' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({ status: 200, description: 'My kudos retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyKudos(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.socialService.getMyKudos(
      user.companyId,
      user.userId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('kudos/leaderboard')
  @RequirePermissions(Permission.VIEW_DIRECTORY)
  @ApiOperation({ summary: 'Get kudos leaderboard (top 10 recipients)' })
  @ApiResponse({ status: 200, description: 'Leaderboard retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLeaderboard(@CurrentUser() user: JwtPayload) {
    return this.socialService.getLeaderboard(user.companyId);
  }
}
