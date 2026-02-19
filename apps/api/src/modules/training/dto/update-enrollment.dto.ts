import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsNumber,
  IsBoolean,
  IsUrl,
  Min,
  Max,
} from 'class-validator';

export enum EnrollmentStatus {
  ENROLLED = 'ENROLLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
  FAILED = 'FAILED',
}

export class UpdateEnrollmentDto {
  @ApiPropertyOptional({ description: 'Progress percentage (0-100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiPropertyOptional({
    enum: EnrollmentStatus,
    description: 'Enrollment status',
  })
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: string;

  @ApiPropertyOptional({ description: 'Assessment score (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiPropertyOptional({ description: 'Whether the employee passed' })
  @IsOptional()
  @IsBoolean()
  passed?: boolean;

  @ApiPropertyOptional({ description: 'Certificate URL after completion' })
  @IsOptional()
  @IsUrl()
  certificateUrl?: string;
}

export class CompleteEnrollmentDto {
  @ApiPropertyOptional({ description: 'Assessment score (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiPropertyOptional({ description: 'Whether the employee passed' })
  @IsOptional()
  @IsBoolean()
  passed?: boolean;

  @ApiPropertyOptional({ description: 'Certificate URL' })
  @IsOptional()
  @IsUrl()
  certificateUrl?: string;
}
