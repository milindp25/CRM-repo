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
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { PdfService } from './pdf/pdf.service';
import { BankExportService } from './bank-export/bank-export.service';
import { StatutoryReportService } from './reports/statutory-report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, Feature, TIER_FEATURES, SubscriptionTier } from '@hrplatform/shared';
import {
  BatchPayrollDto,
  ProcessBonusDto,
  SubmitApprovalDto,
} from './dto';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/services/cache.service';

// TS1272 workaround: define locally
interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: UserRole;
  employeeId?: string;
}

@ApiTags('Payroll')
@ApiBearerAuth()
@Controller({ path: 'payroll', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireFeature('PAYROLL')
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
    private readonly pdfService: PdfService,
    private readonly bankExportService: BankExportService,
    private readonly statutoryReportService: StatutoryReportService,
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Check if a company has the PAYSLIP_ARCHIVE feature via tier, explicit flags, or add-on
   */
  private async hasPayslipArchive(companyId: string): Promise<boolean> {
    const cacheKey = `feature:payslip_archive:${companyId}`;
    return this.cache.getOrSet(cacheKey, async () => {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { featuresEnabled: true, subscriptionTier: true },
      });
      if (!company) return false;

      // Check explicit features
      if ((company.featuresEnabled as string[])?.includes(Feature.PAYSLIP_ARCHIVE)) return true;

      // Check tier features
      const tier = company.subscriptionTier as SubscriptionTier;
      const tierFeatures = TIER_FEATURES[tier] ?? TIER_FEATURES[SubscriptionTier.FREE];
      if (tierFeatures.includes(Feature.PAYSLIP_ARCHIVE as any)) return true;

      // Check paid add-on
      const addon = await this.prisma.companyAddon.findFirst({
        where: {
          companyId,
          status: 'ACTIVE',
          featureAddon: { feature: Feature.PAYSLIP_ARCHIVE, isActive: true },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      return !!addon;
    }, 30_000);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STATIC ROUTES (must be defined BEFORE :id wildcard routes)
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post()
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create a new payroll entry (manual)' })
  @ApiResponse({ status: 201, description: 'Payroll created successfully' })
  async create(
    @Body() createPayrollDto: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payrollService.create(user.companyId, user.userId, createPayrollDto);
  }

  @Get()
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get all payroll entries' })
  @ApiResponse({ status: 200, description: 'Payrolls retrieved successfully' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.payrollService.findAll(user.companyId, {
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      employeeId,
      status,
      month: month ? parseInt(month, 10) : undefined,
      year: year ? parseInt(year, 10) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BATCH PROCESSING (static paths — before :id)
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post('batch')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Batch process payroll for all employees' })
  @ApiResponse({ status: 201, description: 'Batch processing started' })
  @ApiResponse({ status: 409, description: 'Batch already exists for this period' })
  async batchProcess(
    @Body() dto: BatchPayrollDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payrollService.batchProcess(user.companyId, dto.month, dto.year, user.userId);
  }

  @Get('batch/list')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'List all payroll batches' })
  @ApiResponse({ status: 200, description: 'Batches retrieved' })
  async listBatches(@CurrentUser() user: JwtPayload) {
    return this.payrollService.listBatches(user.companyId);
  }

  @Get('batch/:id')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get batch status by ID' })
  @ApiResponse({ status: 200, description: 'Batch retrieved' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async getBatch(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.payrollService.getBatch(id, user.companyId);
  }

  @Post('batch/:id/submit-approval')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Submit payroll batch for approval' })
  @ApiResponse({ status: 200, description: 'Submitted for approval or no workflow configured' })
  async submitForApproval(
    @Param('id') id: string,
    @Body() dto: SubmitApprovalDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payrollService.submitForApproval(id, user.companyId, user.userId, dto.notes);
  }

  @Get('batch/:id/bank-file')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Download bank transfer file (NEFT/ACH) for a batch' })
  @ApiResponse({ status: 200, description: 'Bank file download' })
  async downloadBankFile(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: any,
  ) {
    const result = await this.bankExportService.generateBankFile(id, user.companyId);
    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.buffer.length,
    });
    res.send(result.buffer);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // BONUS (static path — before :id)
  // ═══════════════════════════════════════════════════════════════════════════════

  @Post('bonus')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Process one-time bonus for employee(s)' })
  @ApiResponse({ status: 201, description: 'Bonus processed' })
  async processBonus(
    @Body() dto: ProcessBonusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payrollService.processBonus(user.companyId, dto, user.userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // YTD (static path — before :id)
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('ytd/:employeeId/:fiscalYear')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get YTD summary for an employee' })
  @ApiResponse({ status: 200, description: 'YTD data retrieved' })
  @ApiResponse({ status: 404, description: 'YTD data not found' })
  async getYtd(
    @Param('employeeId') employeeId: string,
    @Param('fiscalYear') fiscalYear: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payrollService.getYtd(user.companyId, employeeId, parseInt(fiscalYear, 10));
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RECONCILIATION (static path — before :id)
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('reconcile')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Reconcile current vs previous month payroll' })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiResponse({ status: 200, description: 'Reconciliation report' })
  async reconcile(
    @Query('month') month: string,
    @Query('year') year: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payrollService.reconcile(user.companyId, parseInt(month, 10), parseInt(year, 10));
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // EMPLOYEE SELF-SERVICE (static paths — before :id)
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('my/latest')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get your latest paycheck (employee self-service)' })
  @ApiResponse({ status: 200, description: 'Latest paycheck retrieved' })
  async getMyLatest(@CurrentUser() user: JwtPayload) {
    if (!user.employeeId) {
      return null;
    }
    return this.payrollService.getMyLatest(user.companyId, user.employeeId);
  }

  @Get('my/history')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get your paycheck history' })
  @ApiResponse({ status: 200, description: 'Paycheck history' })
  async getMyHistory(@CurrentUser() user: JwtPayload) {
    if (!user.employeeId) {
      return { data: [], hasArchive: false, totalRecords: 0 };
    }
    const hasArchive = await this.hasPayslipArchive(user.companyId);
    return this.payrollService.getMyHistory(user.companyId, user.employeeId, hasArchive);
  }

  @Get('my/ytd')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get your YTD summary' })
  @ApiResponse({ status: 200, description: 'YTD summary' })
  async getMyYtd(@CurrentUser() user: JwtPayload) {
    if (!user.employeeId) {
      return null;
    }
    return this.payrollService.getMyYtd(user.companyId, user.employeeId);
  }

  @Get('my/:id/payslip')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get a specific payroll record (employee self-service)' })
  @ApiResponse({ status: 200, description: 'Payroll record' })
  @ApiResponse({ status: 403, description: 'Archive access required' })
  async getMyPayslip(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!user.employeeId) {
      return null;
    }
    const hasArchive = await this.hasPayslipArchive(user.companyId);
    return this.payrollService.getMyPayroll(user.companyId, user.employeeId, id, hasArchive);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // STATUTORY REPORTS (static paths — before :id)
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('reports/form24q')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Download Form 24Q — India quarterly TDS return' })
  @ApiQuery({ name: 'quarter', required: true, type: Number, description: '1-4' })
  @ApiQuery({ name: 'fiscalYear', required: true, type: Number })
  async downloadForm24Q(
    @Query('quarter') quarter: string,
    @Query('fiscalYear') fiscalYear: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: any,
  ) {
    const result = await this.statutoryReportService.generateForm24Q(
      user.companyId, parseInt(quarter, 10), parseInt(fiscalYear, 10),
    );
    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.buffer.length,
    });
    res.send(result.buffer);
  }

  @Get('reports/pf-ecr')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Download PF ECR — India monthly PF challan' })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async downloadPFECR(
    @Query('month') month: string,
    @Query('year') year: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: any,
  ) {
    const result = await this.statutoryReportService.generatePFECR(
      user.companyId, parseInt(month, 10), parseInt(year, 10),
    );
    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.buffer.length,
    });
    res.send(result.buffer);
  }

  @Get('reports/esi')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Download ESI contribution sheet — India monthly' })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async downloadESI(
    @Query('month') month: string,
    @Query('year') year: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: any,
  ) {
    const result = await this.statutoryReportService.generateESIContribution(
      user.companyId, parseInt(month, 10), parseInt(year, 10),
    );
    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.buffer.length,
    });
    res.send(result.buffer);
  }

  @Get('reports/form941')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Download Form 941 — US quarterly federal tax' })
  @ApiQuery({ name: 'quarter', required: true, type: Number, description: '1-4' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  async downloadForm941(
    @Query('quarter') quarter: string,
    @Query('year') year: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: any,
  ) {
    const result = await this.statutoryReportService.generateForm941(
      user.companyId, parseInt(quarter, 10), parseInt(year, 10),
    );
    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.buffer.length,
    });
    res.send(result.buffer);
  }

  @Get('reports/state-tax')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Download US state tax report' })
  @ApiQuery({ name: 'quarter', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'state', required: true, type: String })
  async downloadStateTaxReport(
    @Query('quarter') quarter: string,
    @Query('year') year: string,
    @Query('state') state: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: any,
  ) {
    const result = await this.statutoryReportService.generateStateTaxReport(
      user.companyId, parseInt(quarter, 10), parseInt(year, 10), state,
    );
    res.set({
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.buffer.length,
    });
    res.send(result.buffer);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PDF GENERATION — Form 16 / W-2 (static paths — before :id)
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get('form16/:employeeId/:fiscalYear')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Download Form 16 PDF (India only)' })
  @ApiResponse({ status: 200, description: 'Form 16 PDF stream' })
  async downloadForm16(
    @Param('employeeId') employeeId: string,
    @Param('fiscalYear') fiscalYear: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: any,
  ) {
    const buffer = await this.pdfService.generateForm16(employeeId, parseInt(fiscalYear, 10), user.companyId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="form16_${employeeId}_FY${fiscalYear}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Get('w2/:employeeId/:taxYear')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Download W-2 PDF (US only)' })
  @ApiResponse({ status: 200, description: 'W-2 PDF stream' })
  async downloadW2(
    @Param('employeeId') employeeId: string,
    @Param('taxYear') taxYear: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: any,
  ) {
    const buffer = await this.pdfService.generateW2(employeeId, parseInt(taxYear, 10), user.companyId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="w2_${employeeId}_${taxYear}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // PARAMETERIZED ROUTES (:id) — must be LAST to avoid shadowing static routes
  // ═══════════════════════════════════════════════════════════════════════════════

  @Get(':id')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get a payroll entry by ID' })
  @ApiResponse({ status: 200, description: 'Payroll retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payroll not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtPayload) {
    return this.payrollService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update a payroll entry' })
  @ApiResponse({ status: 200, description: 'Payroll updated successfully' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePayrollDto: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payrollService.update(id, user.companyId, user.userId, updatePayrollDto);
  }

  @Delete(':id')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a payroll entry' })
  @ApiResponse({ status: 204, description: 'Payroll deleted successfully' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payrollService.remove(id, user.companyId, user.userId);
  }

  @Post(':id/process')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Process a draft payroll entry (DRAFT → PROCESSED)' })
  @ApiResponse({ status: 200, description: 'Payroll processed successfully' })
  async processPayroll(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payrollService.processPayroll(id, user.companyId, user.userId, dto);
  }

  @Post(':id/mark-paid')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Mark a payroll entry as paid (PROCESSED → PAID)' })
  @ApiResponse({ status: 200, description: 'Payroll marked as paid' })
  async markAsPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payrollService.markAsPaid(id, user.companyId, user.userId, dto);
  }

  @Post(':id/recalculate')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Recalculate a payroll entry by re-running the tax engine' })
  @ApiResponse({ status: 200, description: 'Payroll recalculated' })
  async recalculate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payrollService.recalculate(id, user.companyId, user.userId);
  }

  @Get(':id/payslip')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN, UserRole.EMPLOYEE)
  @ApiOperation({ summary: 'Download payslip PDF for a payroll entry' })
  @ApiResponse({ status: 200, description: 'Payslip PDF stream' })
  async downloadPayslip(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: any,
  ) {
    const buffer = await this.pdfService.generatePayslip(id, user.companyId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="payslip_${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
