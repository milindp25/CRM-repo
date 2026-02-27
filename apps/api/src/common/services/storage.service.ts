import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { LoggerService } from './logger.service';

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

type StorageType = 'local' | 's3';

@Injectable()
export class StorageService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly storageType: StorageType;

  // S3 config (lazy-loaded)
  private readonly s3Bucket: string;
  private readonly s3Region: string;
  private readonly s3Endpoint: string | undefined;
  private readonly s3AccessKey: string | undefined;
  private readonly s3SecretKey: string | undefined;
  private s3Client: any = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.maxFileSize = Number(
      this.configService.get<string>(
        'MAX_FILE_SIZE',
        String(DEFAULT_MAX_FILE_SIZE),
      ),
    );
    this.storageType = (this.configService.get<string>('STORAGE_TYPE', 'local') as StorageType);

    // S3 config
    this.s3Bucket = this.configService.get<string>('S3_BUCKET', '');
    this.s3Region = this.configService.get<string>('S3_REGION', 'us-east-1');
    this.s3Endpoint = this.configService.get<string>('S3_ENDPOINT');
    this.s3AccessKey = this.configService.get<string>('S3_ACCESS_KEY_ID');
    this.s3SecretKey = this.configService.get<string>('S3_SECRET_ACCESS_KEY');

    if (this.storageType === 's3') {
      this.logger.log(
        `Storage: S3-compatible (bucket=${this.s3Bucket}, region=${this.s3Region}${this.s3Endpoint ? `, endpoint=${this.s3Endpoint}` : ''})`,
        'StorageService',
      );
    } else {
      this.logger.log(`Storage: local filesystem (dir=${this.uploadDir})`, 'StorageService');
    }
  }

  /**
   * Upload a file. Routes to local or S3 based on STORAGE_TYPE.
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
    const key = `${companyId}/${category}/${fileName}`;

    if (this.storageType === 's3') {
      return this.uploadToS3(key, file.buffer, file.mimetype, file.size, sanitizedName);
    }

    return this.uploadToLocal(key, file.buffer, file.mimetype, file.size, sanitizedName);
  }

  /**
   * Delete a file from storage.
   */
  async delete(filePath: string): Promise<void> {
    if (this.storageType === 's3') {
      return this.deleteFromS3(filePath);
    }
    return this.deleteFromLocal(filePath);
  }

  /**
   * Get a readable stream for downloading a file.
   */
  getFileStream(filePath: string): fs.ReadStream | Readable {
    if (this.storageType === 's3') {
      // For S3, we return a placeholder — actual download handled async
      throw new BadRequestException(
        'Use getFileStreamAsync for S3 storage',
      );
    }
    return this.getLocalFileStream(filePath);
  }

  /**
   * Get a readable stream for downloading a file (async, works with both backends).
   */
  async getFileStreamAsync(filePath: string): Promise<Readable> {
    if (this.storageType === 's3') {
      return this.getS3FileStream(filePath);
    }
    return this.getLocalFileStream(filePath);
  }

  /**
   * Generate a pre-signed URL for direct download (S3 only, falls back to null for local).
   */
  async getSignedUrl(filePath: string, expiresInSeconds = 3600): Promise<string | null> {
    if (this.storageType !== 's3') {
      return null;
    }

    try {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

      const client = await this.getS3Client();
      const command = new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: filePath,
      });

      return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL: ${(error as Error).message}`,
        (error as Error).stack,
        'StorageService',
      );
      return null;
    }
  }

  /**
   * Get the absolute filesystem path for a relative file path (local storage only).
   */
  getAbsolutePath(filePath: string): string {
    return path.resolve(this.uploadDir, filePath);
  }

  /** Check which storage backend is active */
  getStorageType(): StorageType {
    return this.storageType;
  }

  // ─── Local Storage ──────────────────────────────────────────────────────

  private async uploadToLocal(
    key: string,
    buffer: Buffer,
    mimeType: string,
    fileSize: number,
    sanitizedName: string,
  ): Promise<UploadResult> {
    const absoluteDirPath = path.resolve(this.uploadDir, path.dirname(key));
    await fs.promises.mkdir(absoluteDirPath, { recursive: true });

    const absoluteFilePath = path.resolve(this.uploadDir, key);
    await fs.promises.writeFile(absoluteFilePath, buffer);

    return {
      filePath: key,
      fileName: sanitizedName,
      mimeType,
      fileSize,
    };
  }

  private async deleteFromLocal(filePath: string): Promise<void> {
    const absolutePath = this.getAbsolutePath(filePath);
    try {
      await fs.promises.unlink(absolutePath);
    } catch (error: unknown) {
      if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }
      throw error;
    }
  }

  private getLocalFileStream(filePath: string): fs.ReadStream {
    const absolutePath = this.getAbsolutePath(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new BadRequestException('File not found on storage');
    }
    return fs.createReadStream(absolutePath);
  }

  // ─── S3-Compatible Storage ──────────────────────────────────────────────

  private async getS3Client(): Promise<any> {
    if (this.s3Client) return this.s3Client;

    const { S3Client } = await import('@aws-sdk/client-s3');

    const config: any = {
      region: this.s3Region,
    };

    if (this.s3Endpoint) {
      config.endpoint = this.s3Endpoint;
      config.forcePathStyle = true; // Required for R2 and MinIO
    }

    if (this.s3AccessKey && this.s3SecretKey) {
      config.credentials = {
        accessKeyId: this.s3AccessKey,
        secretAccessKey: this.s3SecretKey,
      };
    }

    this.s3Client = new S3Client(config);
    return this.s3Client;
  }

  private async uploadToS3(
    key: string,
    buffer: Buffer,
    mimeType: string,
    fileSize: number,
    sanitizedName: string,
  ): Promise<UploadResult> {
    try {
      const { PutObjectCommand } = await import('@aws-sdk/client-s3');
      const client = await this.getS3Client();

      await client.send(
        new PutObjectCommand({
          Bucket: this.s3Bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          ContentDisposition: `attachment; filename="${sanitizedName}"`,
        }),
      );

      return {
        filePath: key,
        fileName: sanitizedName,
        mimeType,
        fileSize,
      };
    } catch (error) {
      this.logger.error(
        `S3 upload failed: ${(error as Error).message}`,
        (error as Error).stack,
        'StorageService',
      );
      throw new BadRequestException('File upload failed');
    }
  }

  private async deleteFromS3(key: string): Promise<void> {
    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const client = await this.getS3Client();

      await client.send(
        new DeleteObjectCommand({
          Bucket: this.s3Bucket,
          Key: key,
        }),
      );
    } catch (error) {
      this.logger.error(
        `S3 delete failed: ${(error as Error).message}`,
        (error as Error).stack,
        'StorageService',
      );
    }
  }

  private async getS3FileStream(key: string): Promise<Readable> {
    try {
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      const client = await this.getS3Client();

      const response = await client.send(
        new GetObjectCommand({
          Bucket: this.s3Bucket,
          Key: key,
        }),
      );

      return response.Body as Readable;
    } catch (error) {
      this.logger.error(
        `S3 download failed: ${(error as Error).message}`,
        (error as Error).stack,
        'StorageService',
      );
      throw new BadRequestException('File not found on storage');
    }
  }

  // ─── Validation ─────────────────────────────────────────────────────────

  private validateFile(file: {
    originalname: string;
    mimetype: string;
    size: number;
  }): void {
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds the maximum allowed size of ${Math.round(this.maxFileSize / (1024 * 1024))}MB`,
      );
    }

    const isAllowedMime = Object.keys(ALLOWED_MIME_TYPES).includes(file.mimetype);
    const ext = path.extname(file.originalname).toLowerCase();
    const isAllowedExt = ALLOWED_EXTENSIONS.includes(ext);

    if (!isAllowedMime && !isAllowedExt) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
      );
    }
  }
}
