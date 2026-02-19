import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUrl,
  IsArray,
  IsEnum,
  IsOptional,
  IsInt,
  IsObject,
  MaxLength,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator';
import { WebhookEvent } from '@hrplatform/shared';

export class CreateWebhookDto {
  @ApiProperty({ description: 'Webhook endpoint display name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Webhook target URL (must be HTTPS in production)' })
  @IsUrl({ require_tld: false })
  url: string;

  @ApiProperty({
    description: 'Events to subscribe to',
    enum: WebhookEvent,
    isArray: true,
    example: [WebhookEvent.EMPLOYEE_CREATED, WebhookEvent.LEAVE_APPROVED],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(WebhookEvent, { each: true })
  events: WebhookEvent[];

  @ApiPropertyOptional({
    description: 'Custom headers to include with webhook requests',
    example: { 'X-Custom-Header': 'value' },
  })
  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Maximum number of retry attempts (1-5)',
    default: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  maxRetries?: number;
}
