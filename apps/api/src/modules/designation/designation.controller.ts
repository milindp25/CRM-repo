import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DesignationService } from './designation.service';
import { CreateDesignationDto, UpdateDesignationDto, DesignationFilterDto, DesignationResponseDto, DesignationPaginationResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { UserRole } from '@hrplatform/shared';

@ApiTags('Designations')
@ApiBearerAuth()
@Controller('designations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DesignationController {
  constructor(private readonly designationService: DesignationService) {}

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Create designation' })
  @ApiResponse({ status: 201, type: DesignationResponseDto })
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateDesignationDto) {
    return this.designationService.create(user.companyId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List designations' })
  @ApiResponse({ status: 200, type: DesignationPaginationResponseDto })
  async findAll(@CurrentUser() user: JwtPayload, @Query() filter: DesignationFilterDto) {
    return this.designationService.findMany(user.companyId, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get designation by ID' })
  @ApiResponse({ status: 200, type: DesignationResponseDto })
  async findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.designationService.findById(id, user.companyId);
  }

  @Patch(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @ApiOperation({ summary: 'Update designation' })
  @ApiResponse({ status: 200, type: DesignationResponseDto })
  async update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() dto: UpdateDesignationDto) {
    return this.designationService.update(id, user.companyId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete designation' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.designationService.delete(id, user.companyId);
  }
}
