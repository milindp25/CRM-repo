import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyService } from '../../modules/api-key/api-key.service';

/**
 * Guard for machine-to-machine (M2M) authentication via API key.
 *
 * Extracts the key from the `X-API-Key` header, validates it,
 * and attaches a synthetic user object to the request so that
 * downstream guards (CompanyIsolation, Permissions, etc.) work as expected.
 *
 * This guard is NOT registered globally. Use the @UseApiKey() decorator
 * to apply it to specific endpoints that support API key authentication.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'];

    if (!apiKeyHeader) {
      throw new UnauthorizedException('Missing X-API-Key header');
    }

    const rawKey = Array.isArray(apiKeyHeader)
      ? apiKeyHeader[0]
      : apiKeyHeader;

    // Validate the API key (throws UnauthorizedException if invalid)
    const apiKey = await this.apiKeyService.validateApiKey(rawKey);

    // Attach a synthetic user object to the request
    // This allows downstream guards (CompanyIsolation, Roles, Permissions)
    // to work with API key authentication
    request.user = {
      userId: apiKey.createdBy,
      email: `api-key:${apiKey.name}`,
      companyId: apiKey.companyId,
      role: 'API_KEY',
      permissions: apiKey.permissions,
      apiKeyId: apiKey.id,
      apiKeyRateLimit: apiKey.rateLimit,
    };

    return true;
  }
}
