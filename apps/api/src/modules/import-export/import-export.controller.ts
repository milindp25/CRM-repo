import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
  StreamableFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, Permission } from '@hrplatform/shared';

interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}
import { ImportExportService } from './import-export.service';
import {
  ImportTemplateParamDto,
  ExportAttendanceQueryDto,
  ExportLeaveQueryDto,
} from './dto';

/**
 * Import/Export Controller
 * Handles bulk data import (CSV upload) and export (CSV download) endpoints.
 *
 * Import endpoints:
 *   POST /v1/import/employees       - Import employees from CSV
 *   GET  /v1/import/template/:type  - Download import template
 *
 * Export endpoints:
 *   GET /v1/export/employees         - Export employees to CSV
 *   GET /v1/export/attendance        - Export attendance to CSV
 *   GET /v1/export/leaves            - Export leaves to CSV
 *   GET /v1/export/departments       - Export departments to CSV
 */
@ApiTags('Import/Export')
@ApiBearerAuth()
@Controller({ version: '1' })
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  // =========================================================================
  // IMPORT ENDPOINTS
  // =========================================================================

  /**
   * Import employees from a CSV file upload.
   * Validates all rows and returns detailed error/success report.
   */
  @Post('import/employees')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.CREATE_EMPLOYEES)
  @RequireFeature('EMPLOYEES')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import employees from CSV file' })
  @ApiResponse({
    status: 201,
    description: 'Import completed with results',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Total rows in CSV' },
        imported: { type: 'number', description: 'Successfully imported count' },
        skipped: { type: 'number', description: 'Skipped row count' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              row: { type: 'number' },
              field: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
        warnings: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid CSV or validation errors' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async importEmployees(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: '.(csv)' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('CSV file is required');
    }

    return this.importExportService.importEmployees(
      user.companyId,
      user.userId,
      file.buffer,
    );
  }

  /**
   * Download an import template CSV with headers only.
   */
  @Get('import/template/:entityType')
  @ApiOperation({ summary: 'Download CSV import template' })
  @ApiParam({
    name: 'entityType',
    description: 'Entity type for template',
    enum: ['employees'],
  })
  @ApiResponse({ status: 200, description: 'CSV template file' })
  @ApiResponse({ status: 400, description: 'Unsupported entity type' })
  async getImportTemplate(
    @Param() params: ImportTemplateParamDto,
    @Res({ passthrough: true }) res: any,
  ): Promise<StreamableFile> {
    const csv = this.importExportService.getImportTemplate(params.entityType);
    const buffer = Buffer.from(csv, 'utf-8');

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${params.entityType}_import_template.csv"`,
    });

    return new StreamableFile(buffer);
  }

  // =========================================================================
  // EXPORT ENDPOINTS
  // =========================================================================

  /**
   * Export all active employees as CSV.
   */
  @Get('export/employees')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.VIEW_EMPLOYEES)
  @RequireFeature('REPORTS')
  @ApiOperation({ summary: 'Export employees to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async exportEmployees(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: any,
  ): Promise<StreamableFile> {
    const csv = await this.importExportService.exportEmployees(user.companyId);
    const buffer = Buffer.from(csv, 'utf-8');
    const filename = `employees_export_${this.getDateString()}.csv`;

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  /**
   * Export attendance records for a given month/year as CSV.
   */
  @Get('export/attendance')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.VIEW_ATTENDANCE)
  @RequireFeature('REPORTS')
  @ApiOperation({ summary: 'Export attendance data to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async exportAttendance(
    @CurrentUser() user: JwtPayload,
    @Query() query: ExportAttendanceQueryDto,
    @Res({ passthrough: true }) res: any,
  ): Promise<StreamableFile> {
    const csv = await this.importExportService.exportAttendance(
      user.companyId,
      query.month,
      query.year,
    );
    const buffer = Buffer.from(csv, 'utf-8');
    const filename = `attendance_export_${query.year}-${String(query.month).padStart(2, '0')}.csv`;

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  /**
   * Export leave records with optional date range filtering as CSV.
   */
  @Get('export/leaves')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.VIEW_LEAVES)
  @RequireFeature('REPORTS')
  @ApiOperation({ summary: 'Export leave data to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async exportLeaves(
    @CurrentUser() user: JwtPayload,
    @Query() query: ExportLeaveQueryDto,
    @Res({ passthrough: true }) res: any,
  ): Promise<StreamableFile> {
    const csv = await this.importExportService.exportLeaves(
      user.companyId,
      query.startDate,
      query.endDate,
    );
    const buffer = Buffer.from(csv, 'utf-8');
    const filename = `leaves_export_${this.getDateString()}.csv`;

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  /**
   * Export departments as CSV.
   */
  @Get('export/departments')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN, UserRole.MANAGER)
  @RequirePermissions(Permission.VIEW_DEPARTMENTS)
  @RequireFeature('REPORTS')
  @ApiOperation({ summary: 'Export departments to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async exportDepartments(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: any,
  ): Promise<StreamableFile> {
    const csv = await this.importExportService.exportDepartments(user.companyId);
    const buffer = Buffer.from(csv, 'utf-8');
    const filename = `departments_export_${this.getDateString()}.csv`;

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  /**
   * Get current date as YYYY-MM-DD string for file naming.
   */
  private getDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
