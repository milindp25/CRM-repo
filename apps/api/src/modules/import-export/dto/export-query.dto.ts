import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for attendance export query parameters
 */
export class ExportAttendanceQueryDto {
  @ApiProperty({
    description: 'Month (1-12)',
    example: 1,
    minimum: 1,
    maximum: 12,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({
    description: 'Year (e.g. 2024)',
    example: 2024,
    minimum: 2000,
    maximum: 2100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;
}

/**
 * DTO for leave export query parameters
 */
export class ExportLeaveQueryDto {
  @ApiPropertyOptional({
    description: 'Start date filter (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate must be in YYYY-MM-DD format',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date filter (YYYY-MM-DD)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate must be in YYYY-MM-DD format',
  })
  endDate?: string;
}
