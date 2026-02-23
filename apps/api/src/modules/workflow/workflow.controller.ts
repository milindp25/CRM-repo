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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@hrplatform/shared';
import { WorkflowService } from './workflow.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateFilterDto,
  StartWorkflowDto,
  ResolveStepDto,
  WorkflowFilterDto,
  CreateDelegationDto,
} from './dto';

interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: UserRole;
  permissions: string[];
}

@ApiTags('Workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireFeature('WORKFLOWS')
@Controller({ path: 'workflows', version: '1' })
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  // ─── Template Endpoints ───────────────────────────────────────────────

  @Post('templates')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a workflow template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createTemplate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.workflowService.createTemplate(
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Get('templates')
  @ApiOperation({ summary: 'List workflow templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTemplates(
    @CurrentUser() user: JwtPayload,
    @Query() filter: TemplateFilterDto,
  ) {
    return this.workflowService.getTemplates(user.companyId, filter);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get a workflow template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplate(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.workflowService.getTemplate(id, user.companyId);
  }

  @Patch('templates/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update a workflow template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async updateTemplate(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.workflowService.updateTemplate(
      id,
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Delete('templates/:id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate a workflow template' })
  @ApiResponse({ status: 204, description: 'Template deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async deleteTemplate(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.workflowService.deleteTemplate(
      id,
      user.companyId,
      user.userId,
    );
  }

  // ─── Instance Endpoints ───────────────────────────────────────────────

  @Post('start')
  @ApiOperation({ summary: 'Start a workflow for an entity' })
  @ApiResponse({ status: 201, description: 'Workflow started successfully' })
  @ApiResponse({
    status: 200,
    description: 'No workflow template configured for this entity type',
  })
  @ApiResponse({ status: 400, description: 'Invalid input or active workflow already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async startWorkflow(
    @CurrentUser() user: JwtPayload,
    @Body() dto: StartWorkflowDto,
  ) {
    const instance = await this.workflowService.startWorkflow(
      user.companyId,
      user.userId,
      dto.entityType,
      dto.entityId,
    );

    if (!instance) {
      return {
        message: 'No workflow template configured for this entity type',
        instance: null,
      };
    }

    return instance;
  }

  @Get('instances')
  @ApiOperation({ summary: 'List workflow instances' })
  @ApiResponse({
    status: 200,
    description: 'Workflow instances retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getInstances(
    @CurrentUser() user: JwtPayload,
    @Query() filter: WorkflowFilterDto,
  ) {
    return this.workflowService.getInstances(user.companyId, filter);
  }

  @Get('instances/:id')
  @ApiOperation({ summary: 'Get a workflow instance by ID' })
  @ApiResponse({
    status: 200,
    description: 'Workflow instance retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  async getInstance(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.workflowService.getInstance(id, user.companyId);
  }

  @Post('instances/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a running workflow' })
  @ApiResponse({ status: 200, description: 'Workflow cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel workflow in current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Instance not found' })
  async cancelWorkflow(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.workflowService.cancelWorkflow(
      id,
      user.userId,
      user.companyId,
    );
    return { message: 'Workflow cancelled successfully' };
  }

  // ─── Approval Endpoints ───────────────────────────────────────────────

  @Get('my-approvals')
  @ApiOperation({ summary: 'Get pending approval steps for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Pending approvals retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyPendingApprovals(@CurrentUser() user: JwtPayload) {
    return this.workflowService.getMyPendingApprovals(
      user.userId,
      user.companyId,
      user.role,
    );
  }

  @Post('steps/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a workflow step' })
  @ApiResponse({ status: 200, description: 'Step approved successfully' })
  @ApiResponse({ status: 400, description: 'Step is not pending or not the current step' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Step not found' })
  async approveStep(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ResolveStepDto,
  ) {
    return this.workflowService.approveStep(
      id,
      user.userId,
      user.companyId,
      dto.comments,
    );
  }

  // ─── Delegation Endpoints ─────────────────────────────────────────────

  @Post('delegations')
  @ApiOperation({ summary: 'Create an approval delegation' })
  @ApiResponse({ status: 201, description: 'Delegation created' })
  async createDelegation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDelegationDto,
  ) {
    return this.workflowService.createDelegation(
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Get('delegations')
  @ApiOperation({ summary: 'List delegations for current user' })
  @ApiResponse({ status: 200, description: 'Delegations retrieved' })
  async getDelegations(@CurrentUser() user: JwtPayload) {
    return this.workflowService.getDelegations(user.companyId, user.userId);
  }

  @Delete('delegations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke a delegation' })
  @ApiResponse({ status: 200, description: 'Delegation revoked' })
  async revokeDelegation(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.workflowService.revokeDelegation(id, user.companyId, user.userId);
  }

  @Post('steps/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a workflow step' })
  @ApiResponse({ status: 200, description: 'Step rejected successfully' })
  @ApiResponse({ status: 400, description: 'Step is not pending or not the current step' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Step not found' })
  async rejectStep(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ResolveStepDto,
  ) {
    return this.workflowService.rejectStep(
      id,
      user.userId,
      user.companyId,
      dto.comments,
    );
  }
}
