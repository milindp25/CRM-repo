import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { LoggerService } from '../../common/services/logger.service';
import { ApiKeyRepository } from './api-key.repository';
import { CreateApiKeyDto } from './dto';

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly repository: ApiKeyRepository,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Create a new API key.
   * Generates a random key, stores only its SHA-256 hash.
   * The full key is returned ONCE in the response and never stored.
   *
   * Key format: hrp_live_<32-byte-hex>
   */
  async createApiKey(
    companyId: string,
    userId: string,
    dto: CreateApiKeyDto,
  ): Promise<{
    apiKey: any;
    rawKey: string;
  }> {
    this.logger.log(
      `Creating API key "${dto.name}" for company ${companyId}`,
      'ApiKeyService',
    );

    // Generate a cryptographically secure random key
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const rawKey = `hrp_live_${randomBytes}`;
    const prefix = 'hrp_live';

    // Hash the full key with SHA-256 for storage
    const keyHash = crypto
      .createHash('sha256')
      .update(rawKey)
      .digest('hex');

    const apiKey = await this.repository.create({
      name: dto.name,
      description: dto.description ?? null,
      prefix,
      keyHash,
      permissions: dto.permissions,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      company: { connect: { id: companyId } },
      creator: { connect: { id: userId } },
    });

    // Create audit log
    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'API_KEY',
      resourceId: apiKey.id,
      newValues: {
        name: dto.name,
        permissions: dto.permissions,
        expiresAt: dto.expiresAt,
      },
    });

    this.logger.log(
      `API key "${dto.name}" created successfully (id: ${apiKey.id})`,
      'ApiKeyService',
    );

    return {
      apiKey,
      rawKey,
    };
  }

  /**
   * List all API keys for a company (paginated).
   * Never returns the keyHash.
   */
  async listApiKeys(
    companyId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    this.logger.log('Listing API keys', 'ApiKeyService');

    const { data, total } = await this.repository.findAllByCompany(
      companyId,
      page,
      limit,
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data,
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
   * Get a single API key by ID (without keyHash).
   */
  async getApiKey(id: string, companyId: string) {
    this.logger.log(`Getting API key ${id}`, 'ApiKeyService');

    const apiKey = await this.repository.findById(id, companyId);

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    return apiKey;
  }

  /**
   * Revoke an API key (soft deactivate).
   * Sets isActive=false and records revokedAt timestamp.
   */
  async revokeApiKey(id: string, companyId: string, userId: string) {
    this.logger.log(`Revoking API key ${id}`, 'ApiKeyService');

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException('API key not found');
    }

    if (!existing.isActive) {
      throw new BadRequestException('API key is already revoked');
    }

    const revoked = await this.repository.revoke(id, companyId);

    // Create audit log
    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'API_KEY',
      resourceId: id,
      oldValues: { isActive: true },
      newValues: { isActive: false, revokedAt: revoked.revokedAt },
    });

    this.logger.log(
      `API key ${id} revoked successfully`,
      'ApiKeyService',
    );

    return revoked;
  }

  /**
   * Hard delete an API key.
   */
  async deleteApiKey(id: string, companyId: string, userId: string) {
    this.logger.log(`Deleting API key ${id}`, 'ApiKeyService');

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException('API key not found');
    }

    await this.repository.delete(id, companyId);

    // Create audit log
    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'API_KEY',
      resourceId: id,
      oldValues: {
        name: existing.name,
        prefix: existing.prefix,
        permissions: existing.permissions,
      },
    });

    this.logger.log(
      `API key ${id} deleted successfully`,
      'ApiKeyService',
    );
  }

  /**
   * Validate an incoming raw API key for M2M authentication.
   * Hashes the key, looks up by hash, checks active + not expired.
   * Updates lastUsedAt on success.
   *
   * Returns the API key record if valid, throws UnauthorizedException otherwise.
   */
  async validateApiKey(rawKey: string) {
    if (!rawKey || !rawKey.startsWith('hrp_live_')) {
      throw new UnauthorizedException('Invalid API key format');
    }

    // Hash the incoming key
    const keyHash = crypto
      .createHash('sha256')
      .update(rawKey)
      .digest('hex');

    const apiKey = await this.repository.findByKeyHash(keyHash);

    if (!apiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check if key is active
    if (!apiKey.isActive) {
      throw new UnauthorizedException('API key has been revoked');
    }

    // Check if key has expired
    if (apiKey.expiresAt && new Date() > new Date(apiKey.expiresAt)) {
      throw new UnauthorizedException('API key has expired');
    }

    // Update lastUsedAt (fire-and-forget to avoid slowing the request)
    this.repository.updateLastUsed(apiKey.id).catch((err) => {
      this.logger.error(
        `Failed to update lastUsedAt for API key ${apiKey.id}: ${err.message}`,
        err.stack,
        'ApiKeyService',
      );
    });

    return apiKey;
  }
}
