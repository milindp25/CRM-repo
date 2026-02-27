import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../../common/services/logger.service';
import { StorageService } from '../../common/services/storage.service';
import { DocumentRepository } from './document.repository';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentFilterDto,
  DocumentResponseDto,
  DocumentPaginationResponseDto,
} from './dto';
import type { Readable } from 'node:stream';

@Injectable()
export class DocumentService {
  constructor(
    private readonly repository: DocumentRepository,
    private readonly storageService: StorageService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Upload a new document.
   * Stores the file on disk and creates a database record.
   */
  async upload(
    companyId: string,
    userId: string,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    dto: CreateDocumentDto,
  ): Promise<DocumentResponseDto> {
    this.logger.log(
      `Uploading document "${dto.name}" for company ${companyId}`,
      'DocumentService',
    );

    // Upload file to storage
    const uploadResult = await this.storageService.upload(
      file,
      companyId,
      dto.category,
    );

    // Build the Prisma create input
    const createData: Prisma.DocumentCreateInput = {
      name: dto.name,
      description: dto.description ?? null,
      fileName: uploadResult.fileName,
      filePath: uploadResult.filePath,
      mimeType: uploadResult.mimeType,
      fileSize: uploadResult.fileSize,
      category: dto.category,
      company: { connect: { id: companyId } },
      uploader: { connect: { id: userId } },
      ...(dto.employeeId && {
        employee: { connect: { id: dto.employeeId } },
      }),
    };

    const document = await this.repository.create(createData);

    // Create audit log
    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'DOCUMENT',
      resourceId: document.id,
      newValues: {
        name: dto.name,
        category: dto.category,
        fileName: uploadResult.fileName,
        employeeId: dto.employeeId,
      },
    });

    this.logger.log(
      `Document "${dto.name}" uploaded successfully (id: ${document.id})`,
      'DocumentService',
    );

    return this.formatDocument(document);
  }

  /**
   * List all documents for a company with pagination and filtering.
   */
  async findAll(
    companyId: string,
    filter: DocumentFilterDto,
  ): Promise<DocumentPaginationResponseDto> {
    this.logger.log('Listing documents', 'DocumentService');

    const { data, total } = await this.repository.findMany(companyId, filter);

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((doc: any) => this.formatDocument(doc)),
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Find a single document by ID within a company.
   */
  async findOne(id: string, companyId: string): Promise<DocumentResponseDto> {
    this.logger.log(`Finding document ${id}`, 'DocumentService');

    const document = await this.repository.findById(id, companyId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.formatDocument(document);
  }

  /**
   * Find all documents for a specific employee within a company.
   */
  async findByEmployee(
    employeeId: string,
    companyId: string,
  ): Promise<DocumentResponseDto[]> {
    this.logger.log(
      `Finding documents for employee ${employeeId}`,
      'DocumentService',
    );

    const documents = await this.repository.findByEmployee(
      employeeId,
      companyId,
    );

    return documents.map((doc: any) => this.formatDocument(doc));
  }

  /**
   * Update document metadata (name, description, category).
   */
  async update(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateDocumentDto,
  ): Promise<DocumentResponseDto> {
    this.logger.log(`Updating document ${id}`, 'DocumentService');

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Document not found');
    }

    const updateData: Prisma.DocumentUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.category !== undefined && { category: dto.category }),
    };

    const updated = await this.repository.update(id, companyId, updateData);

    // Create audit log
    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'DOCUMENT',
      resourceId: id,
      oldValues: {
        name: existing.name,
        description: existing.description,
        category: existing.category,
      },
      newValues: dto,
    });

    return this.formatDocument(updated);
  }

  /**
   * Soft-delete a document and remove the file from storage.
   */
  async remove(
    id: string,
    companyId: string,
    userId: string,
  ): Promise<void> {
    this.logger.log(`Deleting document ${id}`, 'DocumentService');

    const document = await this.repository.findById(id, companyId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Soft delete the record
    await this.repository.softDelete(id, companyId);

    // Remove file from storage
    await this.storageService.delete(document.filePath);

    // Create audit log
    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'DOCUMENT',
      resourceId: id,
      oldValues: {
        name: document.name,
        category: document.category,
        fileName: document.fileName,
        employeeId: document.employeeId,
      },
    });
  }

  /**
   * Get a file stream and metadata for downloading a document.
   */
  async download(
    id: string,
    companyId: string,
  ): Promise<{ stream: Readable; document: DocumentResponseDto; signedUrl?: string }> {
    this.logger.log(`Downloading document ${id}`, 'DocumentService');

    const document = await this.repository.findById(id, companyId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // For S3 storage, try to get a signed URL for direct download
    const signedUrl = await this.storageService.getSignedUrl(document.filePath);

    const stream = await this.storageService.getFileStreamAsync(document.filePath);

    return {
      stream,
      document: this.formatDocument(document),
      signedUrl: signedUrl ?? undefined,
    };
  }

  /**
   * Format a raw Prisma document record into the response DTO shape.
   */
  private formatDocument(document: any): DocumentResponseDto {
    return {
      id: document.id,
      companyId: document.companyId,
      name: document.name,
      description: document.description,
      fileName: document.fileName,
      filePath: document.filePath,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      category: document.category,
      employeeId: document.employeeId,
      uploadedBy: document.uploadedBy,
      isActive: document.isActive,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      deletedAt: document.deletedAt,
      ...(document.employee && {
        employee: {
          id: document.employee.id,
          employeeCode: document.employee.employeeCode,
          firstName: document.employee.firstName,
          lastName: document.employee.lastName,
        },
      }),
      ...(document.uploader && {
        uploader: {
          id: document.uploader.id,
          email: document.uploader.email,
          firstName: document.uploader.firstName,
          lastName: document.uploader.lastName,
        },
      }),
    };
  }
}
