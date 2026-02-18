import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@hrplatform/shared';

interface JwtPayload { userId: string; companyId: string; role: UserRole; }

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller({ path: 'audit-logs', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.HR_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get audit logs' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('resourceType') resourceType?: string,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
  ) {
    return this.auditService.findAll(user.companyId, {
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
      resourceType,
      action,
      userId,
    });
  }
}
