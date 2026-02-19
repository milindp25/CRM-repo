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
import { ExpenseService } from './expense.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ApproveExpenseDto,
  RejectExpenseDto,
  ReimburseExpenseDto,
} from './dto';

interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}

@ApiTags('Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'expenses', version: '1' })
@RequireFeature('EXPENSES')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  // ─── Expense CRUD ──────────────────────────────────────────────────

  @Post()
  @RequirePermissions(Permission.SUBMIT_EXPENSE)
  @ApiOperation({ summary: 'Submit a new expense claim' })
  @ApiResponse({ status: 201, description: 'Expense claim created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expenseService.create(
      user.companyId,
      user.userId,
      dto.employeeId || user.userId,
      dto,
    );
  }

  @Get()
  @RequirePermissions(Permission.VIEW_EXPENSES, Permission.MANAGE_EXPENSES)
  @ApiOperation({ summary: 'List all expense claims with filters' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Filter by employee' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter end date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({ status: 200, description: 'Expense claims retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('employeeId') employeeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.expenseService.findAll(user.companyId, {
      status,
      category,
      employeeId,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('my')
  @RequirePermissions(Permission.SUBMIT_EXPENSE, Permission.VIEW_EXPENSES)
  @ApiOperation({ summary: 'Get my expense claims' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter end date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({ status: 200, description: 'My expense claims retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMy(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.expenseService.findMyExpenses(user.companyId, user.userId, {
      status,
      category,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW_EXPENSES)
  @ApiOperation({ summary: 'Get expense claim by ID' })
  @ApiResponse({ status: 200, description: 'Expense claim retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Expense claim not found' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.expenseService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @RequirePermissions(Permission.SUBMIT_EXPENSE)
  @ApiOperation({ summary: 'Update expense claim (only PENDING status)' })
  @ApiResponse({ status: 200, description: 'Expense claim updated successfully' })
  @ApiResponse({ status: 400, description: 'Only PENDING claims can be updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Expense claim not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenseService.update(id, user.companyId, user.userId, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.SUBMIT_EXPENSE)
  @ApiOperation({ summary: 'Cancel expense claim' })
  @ApiResponse({ status: 200, description: 'Expense claim cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Only PENDING claims can be cancelled' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Expense claim not found' })
  async cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.expenseService.cancel(id, user.companyId, user.userId);
  }

  // ─── Approval Workflow ─────────────────────────────────────────────

  @Patch(':id/approve')
  @RequirePermissions(Permission.APPROVE_EXPENSE)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Approve expense claim' })
  @ApiResponse({ status: 200, description: 'Expense claim approved successfully' })
  @ApiResponse({ status: 400, description: 'Only PENDING claims can be approved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Expense claim not found' })
  async approve(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ApproveExpenseDto,
  ) {
    return this.expenseService.approve(id, user.companyId, user.userId, dto);
  }

  @Patch(':id/reject')
  @RequirePermissions(Permission.APPROVE_EXPENSE)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Reject expense claim' })
  @ApiResponse({ status: 200, description: 'Expense claim rejected successfully' })
  @ApiResponse({ status: 400, description: 'Only PENDING claims can be rejected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Expense claim not found' })
  async reject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: RejectExpenseDto,
  ) {
    return this.expenseService.reject(id, user.companyId, user.userId, dto);
  }

  @Patch(':id/reimburse')
  @RequirePermissions(Permission.MANAGE_EXPENSES)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Mark expense claim as reimbursed' })
  @ApiResponse({ status: 200, description: 'Expense claim marked as reimbursed' })
  @ApiResponse({ status: 400, description: 'Only APPROVED claims can be reimbursed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Expense claim not found' })
  async reimburse(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ReimburseExpenseDto,
  ) {
    return this.expenseService.reimburse(id, user.companyId, user.userId, dto);
  }
}
