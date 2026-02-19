import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdatePolicyDto {
  @ApiPropertyOptional({ description: 'Policy title', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Policy description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Policy content (markdown)' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Policy category',
    enum: POLICY_CATEGORIES,
  })
  @IsOptional()
  @IsString()
  @IsIn(POLICY_CATEGORIES)
  category?: string;

  @ApiPropertyOptional({
    description: 'Policy version',
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
  })
  @IsOptional()
  @IsBoolean()
  requiresAcknowledgment?: boolean;
}
