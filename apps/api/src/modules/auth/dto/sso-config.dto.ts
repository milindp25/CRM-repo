import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateIf,
} from 'class-validator';

/**
 * Supported SSO providers
 */
export enum SSOProvider {
  GOOGLE = 'google',
  SAML = 'saml',
}

/**
 * DTO for updating SSO configuration
 * Used by COMPANY_ADMIN to configure SSO for their company
 */
export class UpdateSSOConfigDto {
  @ApiProperty({
    enum: SSOProvider,
    description: 'SSO provider type',
    example: SSOProvider.GOOGLE,
  })
  @IsEnum(SSOProvider)
  provider: SSOProvider;

  @ApiProperty({
    description: 'Whether SSO is enabled',
    example: true,
  })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({
    description: 'Google OAuth Client ID (required when provider is google)',
    example: '123456789.apps.googleusercontent.com',
  })
  @ValidateIf((o) => o.provider === SSOProvider.GOOGLE && o.enabled)
  @IsString()
  googleClientId?: string;

  @ApiPropertyOptional({
    description: 'Google OAuth Client Secret (required when provider is google)',
    example: 'GOCSPX-xxxxxxxxxxxxxxxx',
  })
  @ValidateIf((o) => o.provider === SSOProvider.GOOGLE && o.enabled)
  @IsString()
  googleClientSecret?: string;

  @ApiPropertyOptional({
    description: 'Allowed email domains for SSO login',
    example: ['company.com', 'subsidiary.com'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDomains?: string[];
}

/**
 * Response DTO for SSO configuration
 * Masks sensitive fields like client secret
 */
export class SSOConfigResponseDto {
  @ApiProperty({ enum: SSOProvider, description: 'SSO provider type' })
  provider: SSOProvider;

  @ApiProperty({ description: 'Whether SSO is enabled' })
  enabled: boolean;

  @ApiPropertyOptional({ description: 'Google OAuth Client ID (partially masked)' })
  googleClientId?: string;

  @ApiProperty({
    description: 'Whether Google Client Secret is configured',
    example: true,
  })
  hasGoogleClientSecret: boolean;

  @ApiPropertyOptional({
    description: 'Allowed email domains for SSO login',
    type: [String],
  })
  allowedDomains?: string[];
}
