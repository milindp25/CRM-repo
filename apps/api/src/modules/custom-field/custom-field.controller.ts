import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
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
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, CustomFieldEntityType } from '@hrplatform/shared';

interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}
import { CustomFieldService } from './custom-field.service';
import { CreateDefinitionDto, UpdateDefinitionDto, SetValuesDto } from './dto';

@ApiTags('Custom Fields')
@ApiBearerAuth()
@Controller({ path: 'custom-fields', version: '1' })
@RequireFeature('CUSTOM_FIELDS')
export class CustomFieldController {
  constructor(private readonly customFieldService: CustomFieldService) {}

  // =========================================================================
  // Definition Management (COMPANY_ADMIN / HR_ADMIN)
  // =========================================================================

  @Post('definitions')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a custom field definition' })
  @ApiResponse({ status: 201, description: 'Custom field definition created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient role' })
  @ApiResponse({ status: 409, description: 'Conflict - field key already exists for entity type' })
  async createDefinition(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDefinitionDto,
  ) {
    return this.customFieldService.createDefinition(user.companyId, dto);
  }

  @Get('definitions')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'List all custom field definitions' })
  @ApiQuery({
    name: 'entityType',
    required: false,
    enum: CustomFieldEntityType,
    description: 'Filter by entity type',
  })
  @ApiResponse({ status: 200, description: 'Custom field definitions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listDefinitions(
    @CurrentUser() user: JwtPayload,
    @Query('entityType') entityType?: string,
  ) {
    return this.customFieldService.listDefinitions(user.companyId, entityType);
  }

  @Get('definitions/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Get a custom field definition by ID' })
  @ApiParam({ name: 'id', description: 'Custom field definition UUID' })
  @ApiResponse({ status: 200, description: 'Custom field definition retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Custom field definition not found' })
  async getDefinition(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.customFieldService.getDefinition(id, user.companyId);
  }

  @Patch('definitions/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update a custom field definition' })
  @ApiParam({ name: 'id', description: 'Custom field definition UUID' })
  @ApiResponse({ status: 200, description: 'Custom field definition updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient role' })
  @ApiResponse({ status: 404, description: 'Custom field definition not found' })
  @ApiResponse({ status: 409, description: 'Conflict - field key already exists' })
  async updateDefinition(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDefinitionDto,
  ) {
    return this.customFieldService.updateDefinition(id, user.companyId, dto);
  }

  @Delete('definitions/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a custom field definition' })
  @ApiParam({ name: 'id', description: 'Custom field definition UUID' })
  @ApiResponse({ status: 204, description: 'Custom field definition deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient role' })
  @ApiResponse({ status: 404, description: 'Custom field definition not found' })
  async deleteDefinition(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.customFieldService.deleteDefinition(id, user.companyId);
  }

  // =========================================================================
  // Value Management (all roles based on entity access)
  // =========================================================================

  @Get('values/:entityType/:entityId')
  @ApiOperation({ summary: 'Get custom field values for an entity' })
  @ApiParam({ name: 'entityType', description: 'Entity type', enum: CustomFieldEntityType })
  @ApiParam({ name: 'entityId', description: 'Entity UUID' })
  @ApiResponse({ status: 200, description: 'Custom field values retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getValues(
    @CurrentUser() user: JwtPayload,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.customFieldService.getEntityValuesFormatted(entityId, user.companyId);
  }

  @Put('values/:entityType/:entityId')
  @ApiOperation({ summary: 'Set custom field values for an entity' })
  @ApiParam({ name: 'entityType', description: 'Entity type', enum: CustomFieldEntityType })
  @ApiParam({ name: 'entityId', description: 'Entity UUID' })
  @ApiResponse({ status: 200, description: 'Custom field values set successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async setValues(
    @CurrentUser() user: JwtPayload,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Body() dto: SetValuesDto,
  ) {
    return this.customFieldService.setEntityValues(
      entityId,
      user.companyId,
      entityType,
      dto.values,
    );
  }
}
