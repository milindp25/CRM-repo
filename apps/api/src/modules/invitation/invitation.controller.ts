import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { InvitationService } from './invitation.service';
import {
  CreateInvitationDto,
  AcceptInvitationDto,
  InvitationFilterDto,
  InvitationResponseDto,
  InvitationPaginationResponseDto,
  InvitationVerifyResponseDto,
  AcceptInvitationResponseDto,
} from './dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CompanyId } from '../../common/decorators/company-id.decorator';
import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Throttle } from '@nestjs/throttler';
import { Permission } from '@hrplatform/shared';

/**
 * Invitation Controller
 * HTTP endpoints for invitation management
 */
@ApiTags('Invitations')
@Controller({
  path: 'invitations',
  version: '1',
})
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  // ===== PUBLIC ENDPOINTS =====

  /**
   * Verify invitation token (public)
   * Must be defined BEFORE :id route to avoid conflict
   */
  @Public()
  @Get('verify/:token')
  @ApiOperation({ summary: 'Verify an invitation token is valid' })
  @ApiParam({ name: 'token', description: 'Invitation token' })
  @ApiResponse({
    status: 200,
    description: 'Token verification result',
    type: InvitationVerifyResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async verifyToken(
    @Param('token') token: string,
  ): Promise<InvitationVerifyResponseDto> {
    return this.invitationService.verifyToken(token);
  }

  /**
   * Accept invitation (public)
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('accept')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Accept an invitation and create a user account',
  })
  @ApiResponse({
    status: 201,
    description: 'Invitation accepted, user account created',
    type: AcceptInvitationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid invitation or validation failed' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 410, description: 'Invitation expired or revoked' })
  async acceptInvitation(
    @Body() dto: AcceptInvitationDto,
  ): Promise<AcceptInvitationResponseDto> {
    return this.invitationService.acceptInvitation(dto);
  }

  // ===== PROTECTED ENDPOINTS =====

  /**
   * Send a new invitation
   */
  @Post()
  @ApiBearerAuth()
  @RequirePermissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Send a new invitation' })
  @ApiResponse({
    status: 201,
    description: 'Invitation sent successfully',
    type: InvitationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions or user limit reached' })
  @ApiResponse({ status: 409, description: 'User or invitation already exists' })
  async create(
    @CurrentUser() user: JwtPayload,
    @CompanyId() companyId: string,
    @Body() dto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    return this.invitationService.invite(companyId, user.userId, dto);
  }

  /**
   * List invitations
   */
  @Get()
  @ApiBearerAuth()
  @RequirePermissions(Permission.MANAGE_USERS)
  @ApiOperation({
    summary: 'List all invitations with filters and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Invitations retrieved successfully',
    type: InvitationPaginationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CompanyId() companyId: string,
    @Query() filterDto: InvitationFilterDto,
  ): Promise<InvitationPaginationResponseDto> {
    return this.invitationService.findAll(companyId, filterDto);
  }

  /**
   * Get invitation by ID
   */
  @Get(':id')
  @ApiBearerAuth()
  @RequirePermissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Get an invitation by ID' })
  @ApiParam({ name: 'id', description: 'Invitation UUID' })
  @ApiResponse({
    status: 200,
    description: 'Invitation retrieved successfully',
    type: InvitationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async findOne(
    @Param('id') id: string,
    @CompanyId() companyId: string,
  ): Promise<InvitationResponseDto> {
    return this.invitationService.findOne(id, companyId);
  }

  /**
   * Revoke invitation
   */
  @Patch(':id/revoke')
  @ApiBearerAuth()
  @RequirePermissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Revoke a pending invitation' })
  @ApiParam({ name: 'id', description: 'Invitation UUID' })
  @ApiResponse({
    status: 200,
    description: 'Invitation revoked successfully',
    type: InvitationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot revoke non-pending invitation' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async revoke(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @CompanyId() companyId: string,
  ): Promise<InvitationResponseDto> {
    return this.invitationService.revoke(id, companyId, user.userId);
  }

  /**
   * Resend invitation
   */
  @Patch(':id/resend')
  @ApiBearerAuth()
  @RequirePermissions(Permission.MANAGE_USERS)
  @ApiOperation({
    summary: 'Resend an invitation (generates new token and resets expiry)',
  })
  @ApiParam({ name: 'id', description: 'Invitation UUID' })
  @ApiResponse({
    status: 200,
    description: 'Invitation resent successfully',
    type: InvitationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot resend invitation with current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async resend(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @CompanyId() companyId: string,
  ): Promise<InvitationResponseDto> {
    return this.invitationService.resend(id, companyId, user.userId);
  }
}
