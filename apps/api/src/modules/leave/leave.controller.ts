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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@hrplatform/shared';
import { LeaveService } from './leave.service';
import {
  CreateLeaveDto,
  UpdateLeaveDto,
  LeaveFilterDto,
  LeaveResponseDto,
  LeavePaginationResponseDto,
  ApproveLeaveDto,
  RejectLeaveDto,
  CancelLeaveDto,
} from './dto';

interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: UserRole;
}

@ApiTags('Leave')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'leave', version: '1' })
@RequireFeature('LEAVE')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create leave request' })
  @ApiResponse({
    status: 201,
    description: 'Leave request created successfully',
    type: LeaveResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateLeaveDto,
  ): Promise<LeaveResponseDto> {
    return this.leaveService.create(user.companyId, user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all leave requests' })
  @ApiResponse({
    status: 200,
    description: 'Leave requests retrieved successfully',
    type: LeavePaginationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() filter: LeaveFilterDto,
  ): Promise<LeavePaginationResponseDto> {
    return this.leaveService.findAll(user.companyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get leave request by ID' })
  @ApiResponse({
    status: 200,
    description: 'Leave request retrieved successfully',
    type: LeaveResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<LeaveResponseDto> {
    return this.leaveService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update leave request' })
  @ApiResponse({
    status: 200,
    description: 'Leave request updated successfully',
    type: LeaveResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateLeaveDto,
  ): Promise<LeaveResponseDto> {
    return this.leaveService.update(id, user.companyId, user.userId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Delete leave request' })
  @ApiResponse({ status: 204, description: 'Leave request deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    return this.leaveService.remove(id, user.companyId, user.userId);
  }

  @Post(':id/approve')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Approve leave request' })
  @ApiResponse({
    status: 200,
    description: 'Leave request approved successfully',
    type: LeaveResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async approve(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ApproveLeaveDto,
  ): Promise<LeaveResponseDto> {
    return this.leaveService.approve(id, user.companyId, user.userId, dto);
  }

  @Post(':id/reject')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Reject leave request' })
  @ApiResponse({
    status: 200,
    description: 'Leave request rejected successfully',
    type: LeaveResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async reject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: RejectLeaveDto,
  ): Promise<LeaveResponseDto> {
    return this.leaveService.reject(id, user.companyId, user.userId, dto);
  }

  @Post(':id/cancel')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Cancel leave request' })
  @ApiResponse({
    status: 200,
    description: 'Leave request cancelled successfully',
    type: LeaveResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Leave request not found' })
  async cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CancelLeaveDto,
  ): Promise<LeaveResponseDto> {
    return this.leaveService.cancel(id, user.companyId, user.userId, dto);
  }
}
