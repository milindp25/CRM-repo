import { Controller, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@hrplatform/shared';

interface JwtPayload { userId: string; email: string; companyId: string; role: UserRole; }

@ApiTags('Users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'List all users in company' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.usersService.findAll(user.companyId);
  }

  @Get(':id')
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get a user by ID' })
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.findOne(id, user.companyId);
  }

  @Patch(':id/role')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Update user role (COMPANY_ADMIN only)' })
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.updateRole(id, user.companyId, role, user.role);
  }

  @Patch(':id/activate')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Activate a user' })
  async activate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.setActive(id, user.companyId, true);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Deactivate a user' })
  async deactivate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.setActive(id, user.companyId, false);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Soft-delete a user (COMPANY_ADMIN only, enforces role hierarchy)' })
  async deleteUser(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.deleteUser(id, user.companyId, user.role, user.userId);
  }
}
