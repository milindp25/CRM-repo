import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsObject,
  MaxLength,
  Length,
} from 'class-validator';

export enum CycleType {
  QUARTERLY = 'QUARTERLY',
  HALF_YEARLY = 'HALF_YEARLY',
  ANNUAL = 'ANNUAL',
  CUSTOM = 'CUSTOM',
}

export class CreateReviewCycleDto {
  @ApiProperty({
    example: 'Q1 2025 Performance Review',
    description: 'Name of the review cycle',
    maxLength: 255,
  })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiPropertyOptional({
    example: 'Quarterly performance review for Q1 2025',
    description: 'Description of the review cycle',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    example: 'QUARTERLY',
    enum: CycleType,
    description: 'Type of review cycle',
  })
  @IsEnum(CycleType)
  cycleType: CycleType;

  @ApiProperty({
    example: '2025-01-01',
    description: 'Start date of the review period (YYYY-MM-DD)',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2025-03-31',
    description: 'End date of the review period (YYYY-MM-DD)',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    example: '2025-04-07T23:59:59.000Z',
    description: 'Deadline for self-review submissions',
  })
  @IsOptional()
  @IsDateString()
  selfReviewDeadline?: string;

  @ApiPropertyOptional({
    example: '2025-04-14T23:59:59.000Z',
    description: 'Deadline for manager review submissions',
  })
  @IsOptional()
  @IsDateString()
  managerReviewDeadline?: string;

  @ApiPropertyOptional({
    example: { min: 1, max: 5, labels: { 1: 'Needs Improvement', 2: 'Below Expectations', 3: 'Meets Expectations', 4: 'Exceeds Expectations', 5: 'Outstanding' } },
    description: 'Rating scale configuration',
  })
  @IsOptional()
  @IsObject()
  ratingScale?: Record<string, any>;
}
