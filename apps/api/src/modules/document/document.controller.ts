import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
  StreamableFile,
  Res,
  UseGuards,
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
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireFeature } from '../../common/decorators/feature.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, Permission } from '@hrplatform/shared';
import { DocumentService } from './document.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentFilterDto,
  DocumentResponseDto,
  DocumentPaginationResponseDto,
} from './dto';

interface JwtPayload {
  userId: string;
  email: string;
  companyId: string;
  role: string;
  permissions: string[];
}

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller({ path: 'documents', version: '1' })
@RequireFeature('DOCUMENTS')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_EMPLOYEES)
  @UseInterceptors(FileInterceptor('file', { storage: undefined }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new document' })
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: '.(pdf|doc|docx|xls|xlsx|png|jpg|jpeg)' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: CreateDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentService.upload(user.companyId, user.userId, file, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all documents (paginated, filterable)' })
  @ApiResponse({
    status: 200,
    description: 'Documents retrieved successfully',
    type: DocumentPaginationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() filter: DocumentFilterDto,
  ): Promise<DocumentPaginationResponseDto> {
    return this.documentService.findAll(user.companyId, filter);
  }

  /**
   * Static path routes MUST be declared before parameterized routes
   * to prevent NestJS from matching "employee" as an :id parameter.
   */
  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get all documents for a specific employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  @ApiResponse({
    status: 200,
    description: 'Employee documents retrieved successfully',
    type: [DocumentResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findByEmployee(
    @CurrentUser() user: JwtPayload,
    @Param('employeeId') employeeId: string,
  ): Promise<DocumentResponseDto[]> {
    return this.documentService.findByEmployee(employeeId, user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details by ID' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<DocumentResponseDto> {
    return this.documentService.findOne(id, user.companyId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a document file' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async download(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, document } = await this.documentService.download(
      id,
      user.companyId,
    );
    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${document.fileName}"`,
    });
    return new StreamableFile(stream);
  }

  @Patch(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_EMPLOYEES)
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({
    status: 200,
    description: 'Document updated successfully',
    type: DocumentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ): Promise<DocumentResponseDto> {
    return this.documentService.update(id, user.companyId, user.userId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.HR_ADMIN)
  @RequirePermissions(Permission.MANAGE_EMPLOYEES)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a document' })
  @ApiParam({ name: 'id', description: 'Document UUID' })
  @ApiResponse({ status: 204, description: 'Document deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.documentService.remove(id, user.companyId, user.userId);
  }
}
