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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RequireFeature } from '../../../common/decorators/feature.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@hrplatform/shared';
import { SalaryStructureService } from './salary-structure.service';
import {
  CreateSalaryStructureDto,
  UpdateSalaryStructureDto,
  SalaryStructureResponseDto,
} from './salary-structure.dto';

// TS1272 workaround: define JwtPayload locally instead of importing
interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: UserRole;
}

@ApiTags('Payroll - Salary Structures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'payroll/salary-structures', version: '1' })
@RequireFeature('PAYROLL')
export class SalaryStructureController {
  constructor(private readonly salaryStructureService: SalaryStructureService) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  @Post()
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Create a new salary structure' })
  @ApiResponse({ status: 201, description: 'Salary structure created successfully', type: SalaryStructureResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request / validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSalaryStructureDto,
  ) {
    return this.salaryStructureService.create(user.companyId, dto);
  }

  // ─── List ─────────────────────────────────────────────────────────────────

  @Get()
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'List salary structures' })
  @ApiQuery({ name: 'designationId', required: false, description: 'Filter by designation UUID' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status', type: Boolean })
  @ApiQuery({ name: 'skip', required: false, description: 'Number of records to skip', type: Number })
  @ApiQuery({ name: 'take', required: false, description: 'Number of records to take', type: Number })
  @ApiResponse({ status: 200, description: 'Salary structures retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('designationId') designationId?: string,
    @Query('isActive') isActive?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.salaryStructureService.findAll(user.companyId, {
      designationId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  // ─── Get One ──────────────────────────────────────────────────────────────

  @Get(':id')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get a salary structure by ID' })
  @ApiResponse({ status: 200, description: 'Salary structure retrieved successfully', type: SalaryStructureResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Salary structure not found' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.salaryStructureService.findOne(id, user.companyId);
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  @Patch(':id')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update a salary structure' })
  @ApiResponse({ status: 200, description: 'Salary structure updated successfully', type: SalaryStructureResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request / validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Salary structure not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSalaryStructureDto,
  ) {
    return this.salaryStructureService.update(id, user.companyId, dto);
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  @Delete(':id')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a salary structure' })
  @ApiResponse({ status: 204, description: 'Salary structure deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Salary structure not found' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.salaryStructureService.remove(id, user.companyId);
  }
}
