import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';
import * as path from 'node:path';

/** Allowed MIME types for document uploads */
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'image/png': '.png',
  'image/jpeg': '.jpg',
};

/** Allowed file extensions */
const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.png',
  '.jpg',
  '.jpeg',
];

/** Default maximum file size: 10 MB */
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface UploadResult {
  filePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

@Injectable()
export class StorageService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.maxFileSize = Number(
      this.configService.get<string>(
        'MAX_FILE_SIZE',
        String(DEFAULT_MAX_FILE_SIZE),
      ),
    );
  }

  /**
   * Upload a file to local filesystem storage.
   * Files are organized as: {UPLOAD_DIR}/{companyId}/{category}/{timestamp}-{originalname}
   */
  async upload(
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    companyId: string,
    category: string,
  ): Promise<UploadResult> {
    this.validateFile(file);

    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const fileName = `${timestamp}-${sanitizedName}`;

    const relativeDirPath = path.join(companyId, category);
    const absoluteDirPath = path.resolve(this.uploadDir, relativeDirPath);

    // Ensure directory exists (recursive mkdir)
    await fs.promises.mkdir(absoluteDirPath, { recursive: true });

    const relativeFilePath = path.join(relativeDirPath, fileName);
    const absoluteFilePath = path.resolve(this.uploadDir, relativeFilePath);

    // Write file to disk
    await fs.promises.writeFile(absoluteFilePath, file.buffer);

    return {
      filePath: relativeFilePath,
      fileName: sanitizedName,
      mimeType: file.mimetype,
      fileSize: file.size,
    };
  }

  /**
   * Delete a file from storage.
   */
  async delete(filePath: string): Promise<void> {
    const absolutePath = this.getAbsolutePath(filePath);
    try {
      await fs.promises.unlink(absolutePath);
    } catch (error: unknown) {
      // Ignore if file doesn't exist (already deleted)
      if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      throw error;
    }
  }

  /**
   * Get the absolute filesystem path for a relative file path.
   */
  getAbsolutePath(filePath: string): string {
    return path.resolve(this.uploadDir, filePath);
  }

  /**
   * Get a readable stream for downloading a file.
   */
  getFileStream(filePath: string): fs.ReadStream {
    const absolutePath = this.getAbsolutePath(filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new BadRequestException('File not found on storage');
    }

    return fs.createReadStream(absolutePath);
  }

  /**
   * Validate file type and size constraints.
   */
  private validateFile(file: {
    originalname: string;
    mimetype: string;
    size: number;
  }): void {
    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds the maximum allowed size of ${Math.round(this.maxFileSize / (1024 * 1024))}MB`,
      );
    }

    // Validate MIME type
    const isAllowedMime = Object.keys(ALLOWED_MIME_TYPES).includes(
      file.mimetype,
    );

    // Validate extension
    const ext = path.extname(file.originalname).toLowerCase();
    const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);

    if (!isAllowedMime && !isAllowedExt) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }
  }
}
