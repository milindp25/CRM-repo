import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@hrplatform/shared';
import { Roles } from '../common/decorators/roles.decorator.js';
import { BillingService } from './billing.service.js';
import {
  CreateBillingPlanDto,
  UpdateBillingPlanDto,
  AssignBillingDto,
  UpdateInvoiceStatusDto,
} from './dto/index.js';

@ApiTags('Billing')
@ApiBearerAuth()
@Controller({ version: '1' })
@Roles(UserRole.SUPER_ADMIN)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ── Billing Plans ──────────────────────────────────────────────────

  @Get('billing/plans')
  @ApiOperation({ summary: 'List all billing plans' })
  async listPlans() {
    return this.billingService.listPlans();
  }

  @Post('billing/plans')
  @ApiOperation({ summary: 'Create a billing plan' })
  async createPlan(@Body() dto: CreateBillingPlanDto) {
    return this.billingService.createPlan(dto);
  }

  @Patch('billing/plans/:id')
  @ApiOperation({ summary: 'Update a billing plan' })
  async updatePlan(@Param('id') id: string, @Body() dto: UpdateBillingPlanDto) {
    return this.billingService.updatePlan(id, dto);
  }

  // ── Company Billing ────────────────────────────────────────────────

  @Get('companies/:companyId/billing')
  @ApiOperation({ summary: 'Get company billing details' })
  async getCompanyBilling(@Param('companyId') companyId: string) {
    return this.billingService.getCompanyBilling(companyId);
  }

  @Post('companies/:companyId/billing')
  @ApiOperation({ summary: 'Assign billing plan to company' })
  async assignBillingPlan(
    @Param('companyId') companyId: string,
    @Body() dto: AssignBillingDto,
  ) {
    return this.billingService.assignBillingPlan(
      companyId,
      dto.billingPlanId,
      dto.billingCycle,
    );
  }

  @Patch('companies/:companyId/billing')
  @ApiOperation({ summary: 'Update company billing settings' })
  async updateCompanyBilling(
    @Param('companyId') companyId: string,
    @Body() dto: AssignBillingDto,
  ) {
    return this.billingService.updateCompanyBilling(companyId, dto);
  }

  // ── Invoices ───────────────────────────────────────────────────────

  @Get('companies/:companyId/invoices')
  @ApiOperation({ summary: 'List invoices for a company' })
  async getCompanyInvoices(@Param('companyId') companyId: string) {
    return this.billingService.getCompanyInvoices(companyId);
  }

  @Post('companies/:companyId/invoices/generate')
  @ApiOperation({ summary: 'Generate invoice for current period' })
  async generateInvoice(@Param('companyId') companyId: string) {
    return this.billingService.generateInvoice(companyId);
  }

  @Patch('invoices/:id/status')
  @ApiOperation({ summary: 'Update invoice status (mark paid, etc.)' })
  async updateInvoiceStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    return this.billingService.updateInvoiceStatus(id, dto.status);
  }

  // ── Revenue Dashboard ─────────────────────────────────────────────

  @Get('billing/revenue')
  @ApiOperation({ summary: 'Get platform revenue summary (MRR, ARR, breakdown)' })
  async getRevenueSummary() {
    return this.billingService.getRevenueSummary();
  }
}
