import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, Permission } from '@hrplatform/shared';
import { AssetService } from './asset.service';
import {
  CreateAssetDto,
  UpdateAssetDto,
  AssignAssetDto,
  ReturnAssetDto,
} from './dto';

interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}

@ApiTags('Assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'assets', version: '1' })
@RequireFeature('ASSETS')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  // ─── Asset CRUD ────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_ASSETS)
  @ApiOperation({ summary: 'Create a new asset' })
  @ApiResponse({ status: 201, description: 'Asset created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAssetDto,
  ) {
    return this.assetService.create(user.companyId, user.userId, dto);
  }

  @Get()
  @RequirePermissions(Permission.VIEW_ASSETS)
  @ApiOperation({ summary: 'List all assets (paginated, filterable)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by asset status' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by asset category' })
  @ApiQuery({ name: 'assignedTo', required: false, description: 'Filter by assigned employee ID' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name, asset code, or serial number' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Assets retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.assetService.findAll(user.companyId, {
      status,
      category,
      assignedTo,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_ASSETS)
  @ApiOperation({ summary: 'Get asset details by ID' })
  @ApiParam({ name: 'id', description: 'Asset UUID' })
  @ApiResponse({ status: 200, description: 'Asset retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.assetService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_ASSETS)
  @ApiOperation({ summary: 'Update asset details' })
  @ApiParam({ name: 'id', description: 'Asset UUID' })
  @ApiResponse({ status: 200, description: 'Asset updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.assetService.update(id, user.companyId, user.userId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_ASSETS)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete an asset' })
  @ApiParam({ name: 'id', description: 'Asset UUID' })
  @ApiResponse({ status: 204, description: 'Asset deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - asset is currently assigned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.assetService.remove(id, user.companyId, user.userId);
  }

  // ─── Assignment Endpoints ──────────────────────────────────────────────

  @Post(':id/assign')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_ASSETS)
  @ApiOperation({ summary: 'Assign an asset to an employee' })
  @ApiParam({ name: 'id', description: 'Asset UUID' })
  @ApiResponse({ status: 201, description: 'Asset assigned successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - asset not available' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async assign(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AssignAssetDto,
  ) {
    return this.assetService.assign(id, user.companyId, user.userId, dto);
  }

  @Post(':id/return')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_ASSETS)
  @ApiOperation({ summary: 'Return an asset from an employee' })
  @ApiParam({ name: 'id', description: 'Asset UUID' })
  @ApiResponse({ status: 201, description: 'Asset returned successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - asset not assigned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async returnAsset(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReturnAssetDto,
  ) {
    return this.assetService.return(id, user.companyId, user.userId, dto);
  }

  @Get(':id/history')
  @RequirePermissions(Permission.VIEW_ASSETS)
  @ApiOperation({ summary: 'Get assignment history for an asset' })
  @ApiParam({ name: 'id', description: 'Asset UUID' })
  @ApiResponse({ status: 200, description: 'Assignment history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  async getHistory(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.assetService.getAssignmentHistory(id, user.companyId);
  }
}
