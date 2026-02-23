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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permission, UserRole } from '@hrplatform/shared';
import { ContractorService } from './contractor.service';
import {
  CreateContractorDto,
  UpdateContractorDto,
  CreateInvoiceDto,
} from './dto';

interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}

@ApiTags('Contractors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'contractors', version: '1' })
@RequireFeature('CONTRACTORS')
export class ContractorController {
  constructor(private readonly contractorService: ContractorService) {}

  // ─── Contractor CRUD ──────────────────────────────────────────────

  @Post()
  @RequirePermissions(Permission.MANAGE_CONTRACTORS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a new contractor' })
  @ApiResponse({ status: 201, description: 'Contractor created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateContractorDto,
  ) {
    return this.contractorService.createContractor(
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Get()
  @RequirePermissions(Permission.VIEW_CONTRACTORS)
  @ApiOperation({ summary: 'List all contractors with filters' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (ACTIVE, INACTIVE, TERMINATED)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({ status: 200, description: 'Contractors retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contractorService.findAllContractors(user.companyId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_CONTRACTORS)
  @ApiOperation({ summary: 'Get contractor by ID (includes invoices)' })
  @ApiResponse({ status: 200, description: 'Contractor retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.contractorService.findContractor(id, user.companyId);
  }

  @Patch(':id')
  @RequirePermissions(Permission.MANAGE_CONTRACTORS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update contractor details' })
  @ApiResponse({ status: 200, description: 'Contractor updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateContractorDto,
  ) {
    return this.contractorService.updateContractor(
      id,
      user.companyId,
      user.userId,
      dto,
    );
  }

  @Delete(':id')
  @RequirePermissions(Permission.MANAGE_CONTRACTORS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Terminate contractor (soft delete)' })
  @ApiResponse({ status: 200, description: 'Contractor terminated successfully' })
  @ApiResponse({ status: 400, description: 'Contractor is already terminated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.contractorService.deleteContractor(id, user.companyId, user.userId);
  }

  // ─── Invoice Management ───────────────────────────────────────────

  @Post(':id/invoices')
  @RequirePermissions(Permission.MANAGE_CONTRACTORS)
  @ApiOperation({ summary: 'Submit an invoice for a contractor' })
  @ApiResponse({ status: 201, description: 'Invoice submitted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  async submitInvoice(
    @CurrentUser() user: JwtPayload,
    @Param('id') contractorId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.contractorService.submitInvoice(
      user.companyId,
      contractorId,
      user.userId,
      dto,
    );
  }

  @Get(':id/invoices')
  @RequirePermissions(Permission.VIEW_CONTRACTORS)
  @ApiOperation({ summary: 'List invoices for a contractor' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  async getContractorInvoices(
    @CurrentUser() user: JwtPayload,
    @Param('id') contractorId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contractorService.getContractorInvoices(
      user.companyId,
      contractorId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get('invoices/:invoiceId')
  @RequirePermissions(Permission.VIEW_CONTRACTORS)
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoice(
    @CurrentUser() user: JwtPayload,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.contractorService.getInvoice(invoiceId, user.companyId);
  }

  // ─── Invoice Actions ──────────────────────────────────────────────

  @Post('invoices/:id/approve')
  @RequirePermissions(Permission.MANAGE_CONTRACTORS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Approve a pending invoice' })
  @ApiResponse({ status: 200, description: 'Invoice approved successfully' })
  @ApiResponse({ status: 400, description: 'Only PENDING invoices can be approved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async approveInvoice(
    @CurrentUser() user: JwtPayload,
    @Param('id') invoiceId: string,
  ) {
    return this.contractorService.approveInvoice(invoiceId, user.userId, user.companyId);
  }

  @Post('invoices/:id/pay')
  @RequirePermissions(Permission.MANAGE_CONTRACTORS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Mark an approved invoice as paid' })
  @ApiResponse({ status: 200, description: 'Invoice marked as paid' })
  @ApiResponse({ status: 400, description: 'Only APPROVED invoices can be paid' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async payInvoice(
    @CurrentUser() user: JwtPayload,
    @Param('id') invoiceId: string,
  ) {
    return this.contractorService.payInvoice(invoiceId, user.userId, user.companyId);
  }

  @Post('invoices/:id/reject')
  @RequirePermissions(Permission.MANAGE_CONTRACTORS)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Reject a pending invoice' })
  @ApiResponse({ status: 200, description: 'Invoice rejected' })
  @ApiResponse({ status: 400, description: 'Only PENDING invoices can be rejected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async rejectInvoice(
    @CurrentUser() user: JwtPayload,
    @Param('id') invoiceId: string,
  ) {
    return this.contractorService.rejectInvoice(invoiceId, user.userId, user.companyId);
  }
}
