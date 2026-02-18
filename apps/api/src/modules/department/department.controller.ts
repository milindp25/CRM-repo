import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
  ApiParam,
} from '@nestjs/swagger';
import { DepartmentService } from './department.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentFilterDto,
  DepartmentResponseDto,
  DepartmentPaginationResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '@hrplatform/shared';

/**
 * Department Controller
 * HTTP endpoints for department management
 */
@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  /**
   * Create department
   */
  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({
    status: 201,
    description: 'Department created successfully',
    type: DepartmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Department code already exists' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() createDto: CreateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return this.departmentService.create(user.companyId, createDto);
  }

  /**
   * List departments
   */
  @Get()
  @ApiOperation({ summary: 'List all departments with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Departments retrieved successfully',
    type: DepartmentPaginationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() filterDto: DepartmentFilterDto,
  ): Promise<DepartmentPaginationResponseDto> {
    return this.departmentService.findMany(user.companyId, filterDto);
  }

  /**
   * Get department hierarchy
   */
  @Get('hierarchy')
  @ApiOperation({ summary: 'Get department hierarchy (tree structure)' })
  @ApiResponse({
    status: 200,
    description: 'Department hierarchy retrieved successfully',
    type: [DepartmentResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHierarchy(
    @CurrentUser() user: JwtPayload,
  ): Promise<DepartmentResponseDto[]> {
    return this.departmentService.getHierarchy(user.companyId);
  }

  /**
   * Get department by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a department by ID' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({
    status: 200,
    description: 'Department retrieved successfully',
    type: DepartmentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  async findById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<DepartmentResponseDto> {
    return this.departmentService.findById(id, user.companyId);
  }

  /**
   * Update department
   */
  @Patch(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update a department' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({
    status: 200,
    description: 'Department updated successfully',
    type: DepartmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({ status: 409, description: 'Department code already exists or circular hierarchy' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() updateDto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return this.departmentService.update(id, user.companyId, updateDto);
  }

  /**
   * Delete department
   */
  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a department (soft delete)' })
  @ApiParam({ name: 'id', description: 'Department UUID' })
  @ApiResponse({ status: 204, description: 'Department deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Department not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete department with employees or sub-departments' })
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.departmentService.delete(id, user.companyId);
  }
}
