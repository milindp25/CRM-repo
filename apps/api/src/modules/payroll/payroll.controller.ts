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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@hrplatform/shared';

interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: UserRole;
}

@ApiTags('Payroll')
@Controller({ path: 'payroll', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post()
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create a new payroll entry' })
  @ApiResponse({ status: 201, description: 'Payroll created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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

  @Get(':id')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get a payroll entry by ID' })
  @ApiResponse({ status: 200, description: 'Payroll retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payroll not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.payrollService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update a payroll entry' })
  @ApiResponse({ status: 200, description: 'Payroll updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payroll not found' })
  async update(
    @Param('id') id: string,
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payroll not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payrollService.remove(id, user.companyId, user.userId);
  }

  @Post(':id/process')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Process a payroll entry' })
  @ApiResponse({ status: 200, description: 'Payroll processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payroll not found' })
  async processPayroll(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payrollService.processPayroll(id, user.companyId, user.userId, dto);
  }

  @Post(':id/mark-paid')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Mark a payroll entry as paid' })
  @ApiResponse({ status: 200, description: 'Payroll marked as paid successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Payroll not found' })
  async markAsPaid(
    @Param('id') id: string,
    @Body() dto: any,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.payrollService.markAsPaid(id, user.companyId, user.userId, dto);
  }
}
