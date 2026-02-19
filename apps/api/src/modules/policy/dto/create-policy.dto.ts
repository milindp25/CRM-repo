import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  MaxLength,
  IsIn,
} from 'class-validator';

const POLICY_CATEGORIES = [
  'HR',
  'IT',
  'FINANCE',
  'COMPLIANCE',
  'SAFETY',
  'GENERAL',
] as const;

export class CreatePolicyDto {
  @ApiProperty({ description: 'Policy title', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Policy description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Policy content (markdown)' })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Policy category',
    enum: POLICY_CATEGORIES,
    example: 'HR',
  })
  @IsString()
  @IsIn(POLICY_CATEGORIES)
  category: string;

  @ApiPropertyOptional({
    description: 'Policy version',
    example: '1.0',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;

  @ApiPropertyOptional({ description: 'Effective date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({
    description: 'Whether employees must acknowledge this policy',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiresAcknowledgment?: boolean;
}
