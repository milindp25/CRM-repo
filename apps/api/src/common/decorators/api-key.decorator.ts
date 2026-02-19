import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { ApiKeyGuard } from '../guards/api-key.guard';

/**
 * Decorator to enable API key authentication on an endpoint.
 *
 * Applies the ApiKeyGuard which:
 * - Extracts the key from the `X-API-Key` header
 * - Validates and authenticates the API key
 * - Attaches a synthetic user object for downstream guard compatibility
 *
 * Usage: @UseApiKey()
 *
 * Note: Endpoints decorated with @UseApiKey() should also use @Public()
 * to skip the global JWT auth guard, since API key auth replaces JWT.
 */
export const UseApiKey = () =>
  applyDecorators(
    UseGuards(ApiKeyGuard),
    ApiHeader({
      name: 'X-API-Key',
      description: 'API key for machine-to-machine authentication',
      required: true,
    }),
  );
