import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  Length,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

/**
 * Create Designation DTO
 */
export class CreateDesignationDto {
  @ApiProperty({
    example: 'Senior Software Engineer',
    description: 'Job title/designation name',
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100)
  title: string;

  @ApiProperty({
    example: 'SSE',
    description: 'Unique designation code',
    maxLength: 50,
  })
  @IsString()
  @Length(1, 50)
  code: string;

  @ApiPropertyOptional({
    example: 'Responsible for designing and developing software solutions',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    example: 4,
    description: 'Job level (1=Entry, 2=Junior, 3=Mid, 4=Senior, 5=Lead, 6=Manager, 7=Director, 8=VP, 9=C-Level)',
    minimum: 1,
    maximum: 9,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  level?: number;

  @ApiPropertyOptional({
    example: 800000,
    description: 'Minimum salary for this designation',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSalary?: number;

  @ApiPropertyOptional({
    example: 1200000,
    description: 'Maximum salary for this designation',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxSalary?: number;

  @ApiPropertyOptional({
    example: 'INR',
    description: 'Salary currency code',
    default: 'INR',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;
}
