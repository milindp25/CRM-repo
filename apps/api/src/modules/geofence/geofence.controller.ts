import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permission, UserRole } from '@hrplatform/shared';
import { GeofenceService } from './geofence.service';
import { CreateZoneDto, UpdateZoneDto, ValidateLocationDto } from './dto';

// TS1272 workaround: define JwtPayload locally
interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}

@ApiTags('Geofence')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'geofence', version: '1' })
@RequireFeature('ATTENDANCE')
export class GeofenceController {
  constructor(private readonly geofenceService: GeofenceService) {}

  // ─── Zone CRUD (Admin Only) ─────────────────────────────────────────

  @Post('zones')
  @RequirePermissions(Permission.MANAGE_ATTENDANCE)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a new geofence zone' })
  @ApiResponse({ status: 201, description: 'Geofence zone created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createZone(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateZoneDto,
  ) {
    return this.geofenceService.createZone(user.companyId, user.userId, dto);
  }

  @Get('zones')
  @RequirePermissions(Permission.MANAGE_ATTENDANCE, Permission.VIEW_ATTENDANCE)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List all geofence zones' })
  @ApiResponse({ status: 200, description: 'Geofence zones retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAllZones(
    @CurrentUser() user: JwtPayload,
  ) {
    return this.geofenceService.findAllZones(user.companyId);
  }

  @Get('zones/:id')
  @RequirePermissions(Permission.MANAGE_ATTENDANCE, Permission.VIEW_ATTENDANCE)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get geofence zone by ID' })
  @ApiResponse({ status: 200, description: 'Geofence zone retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Geofence zone not found' })
  async findZone(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.geofenceService.findZone(id, user.companyId);
  }

  @Patch('zones/:id')
  @RequirePermissions(Permission.MANAGE_ATTENDANCE)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update a geofence zone' })
  @ApiResponse({ status: 200, description: 'Geofence zone updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Geofence zone not found' })
  async updateZone(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateZoneDto,
  ) {
    return this.geofenceService.updateZone(id, user.companyId, user.userId, dto);
  }

  @Delete('zones/:id')
  @RequirePermissions(Permission.MANAGE_ATTENDANCE)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Deactivate a geofence zone (soft delete)' })
  @ApiResponse({ status: 200, description: 'Geofence zone deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Geofence zone not found' })
  async deleteZone(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.geofenceService.deleteZone(id, user.companyId, user.userId);
  }

  // ─── Location Validation (Any Authenticated User) ───────────────────

  @Post('validate')
  @RequirePermissions(Permission.MARK_ATTENDANCE)
  @ApiOperation({ summary: 'Validate current location against geofence zones' })
  @ApiResponse({
    status: 200,
    description: 'Location validation result',
    schema: {
      type: 'object',
      properties: {
        verified: { type: 'boolean' },
        zoneName: { type: 'string' },
        distance: { type: 'number', description: 'Distance in meters' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async validateLocation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ValidateLocationDto,
  ) {
    return this.geofenceService.validateLocation(
      user.companyId,
      dto.latitude,
      dto.longitude,
      dto.ipAddress,
    );
  }
}
