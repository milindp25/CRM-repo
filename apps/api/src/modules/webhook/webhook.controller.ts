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
  ParseIntPipe,
  DefaultValuePipe,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@hrplatform/shared';

interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}
import { WebhookService } from './webhook.service';
import { CreateWebhookDto, UpdateWebhookDto } from './dto';

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'webhooks', version: '1' })
@RequireFeature('WEBHOOKS')
@Roles(UserRole.COMPANY_ADMIN)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new webhook endpoint' })
  @ApiResponse({
    status: 201,
    description: 'Webhook endpoint created successfully. The full HMAC secret is included only in this response.',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient role or feature not enabled' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.webhookService.createEndpoint(user.companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all webhook endpoints for the company' })
  @ApiResponse({
    status: 200,
    description: 'Webhook endpoints retrieved successfully. Secrets are masked.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.webhookService.listEndpoints(user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a webhook endpoint by ID' })
  @ApiParam({ name: 'id', description: 'Webhook endpoint UUID' })
  @ApiResponse({
    status: 200,
    description: 'Webhook endpoint retrieved successfully. Secret is masked.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook endpoint not found' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.webhookService.getEndpoint(id, user.companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a webhook endpoint' })
  @ApiParam({ name: 'id', description: 'Webhook endpoint UUID' })
  @ApiResponse({
    status: 200,
    description: 'Webhook endpoint updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook endpoint not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhookService.updateEndpoint(id, user.companyId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a webhook endpoint and all its delivery records' })
  @ApiParam({ name: 'id', description: 'Webhook endpoint UUID' })
  @ApiResponse({ status: 204, description: 'Webhook endpoint deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook endpoint not found' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.webhookService.deleteEndpoint(id, user.companyId);
  }

  @Post(':id/regenerate-secret')
  @ApiOperation({ summary: 'Regenerate the HMAC signing secret for a webhook endpoint' })
  @ApiParam({ name: 'id', description: 'Webhook endpoint UUID' })
  @ApiResponse({
    status: 200,
    description: 'Secret regenerated. The full new secret is included in this response.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook endpoint not found' })
  async regenerateSecret(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.webhookService.regenerateSecret(id, user.companyId);
  }

  @Get(':id/deliveries')
  @ApiOperation({ summary: 'Get delivery history for a webhook endpoint' })
  @ApiParam({ name: 'id', description: 'Webhook endpoint UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20)' })
  @ApiResponse({
    status: 200,
    description: 'Delivery history retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook endpoint not found' })
  async getDeliveries(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.webhookService.getDeliveries(id, user.companyId, page, limit);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Send a test webhook event to the endpoint' })
  @ApiParam({ name: 'id', description: 'Webhook endpoint UUID' })
  @ApiResponse({
    status: 200,
    description: 'Test webhook sent. Returns the delivery result.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Webhook endpoint not found' })
  async sendTestEvent(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.webhookService.sendTestEvent(id, user.companyId);
  }
}
