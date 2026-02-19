import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUrl,
  IsArray,
  IsEnum,
  IsOptional,
  IsInt,
  IsBoolean,
  IsObject,
  MaxLength,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { WebhookEvent } from '@hrplatform/shared';

export class UpdateWebhookDto {
  @ApiPropertyOptional({ description: 'Webhook endpoint display name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Webhook target URL' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;

  @ApiPropertyOptional({
    description: 'Events to subscribe to',
    enum: WebhookEvent,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(WebhookEvent, { each: true })
  events?: WebhookEvent[];

  @ApiPropertyOptional({
    description: 'Custom headers to include with webhook requests',
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Maximum number of retry attempts (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  maxRetries?: number;

  @ApiPropertyOptional({
    description: 'Whether the webhook endpoint is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
