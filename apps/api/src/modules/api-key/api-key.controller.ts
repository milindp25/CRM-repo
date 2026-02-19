import {
  Controller,
  Get,
  Post,
  Delete,
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
import { UserRole } from '@hrplatform/shared';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto';

interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: string;
  permissions: string[];
}

@ApiTags('API Keys')
@ApiBearerAuth()
@Controller({ path: 'api-keys', version: '1' })
@RequireFeature('API_ACCESS')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Create a new API key',
    description:
      'Generates a new API key for M2M authentication. The full key is returned ONCE in the response and cannot be retrieved again.',
  })
  @ApiResponse({
    status: 201,
    description: 'API key created successfully. The raw key is included in the response.',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions or feature not enabled' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateApiKeyDto,
  ) {
    const { apiKey, rawKey } = await this.apiKeyService.createApiKey(
      user.companyId,
      user.userId,
      dto,
    );

    return {
      ...apiKey,
      key: rawKey,
    };
  }

  @Get()
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'List all API keys for the company',
    description: 'Returns a paginated list of API keys. Key hashes are never returned.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.apiKeyService.listApiKeys(
      user.companyId,
      pageNum,
      limitNum,
    );
  }

  @Get(':id')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get a single API key by ID' })
  @ApiParam({ name: 'id', description: 'API key UUID' })
  @ApiResponse({ status: 200, description: 'API key retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.apiKeyService.getApiKey(id, user.companyId);
  }

  @Delete(':id/revoke')
  @Roles(UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke an API key',
    description: 'Deactivates the API key without deleting it. The key can no longer be used for authentication.',
  })
  @ApiParam({ name: 'id', description: 'API key UUID' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully' })
  @ApiResponse({ status: 400, description: 'API key is already revoked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async revoke(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.apiKeyService.revokeApiKey(id, user.companyId, user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Permanently delete an API key',
    description: 'Hard deletes the API key record. This action cannot be undone.',
  })
  @ApiParam({ name: 'id', description: 'API key UUID' })
  @ApiResponse({ status: 204, description: 'API key deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.apiKeyService.deleteApiKey(id, user.companyId, user.userId);
  }
}
