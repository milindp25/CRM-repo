import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  IsBoolean,
  IsNumber,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
  REMOTE = 'REMOTE',
}

export class CreateJobPostingDto {
  @ApiProperty({ description: 'Job title', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Job description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Job requirements' })
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional({ description: 'Job location', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({
    enum: JobType,
    description: 'Job type',
    default: JobType.FULL_TIME,
  })
  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @ApiPropertyOptional({ description: 'Experience required', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  experience?: string;

  @ApiPropertyOptional({ description: 'Minimum salary' })
  @IsOptional()
  @IsNumber()
  salaryMin?: number;

  @ApiPropertyOptional({ description: 'Maximum salary' })
  @IsOptional()
  @IsNumber()
  salaryMax?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'INR' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ description: 'Whether to display salary on posting' })
  @IsOptional()
  @IsBoolean()
  showSalary?: boolean;

  @ApiPropertyOptional({ description: 'Department UUID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Designation UUID' })
  @IsOptional()
  @IsUUID()
  designationId?: string;

  @ApiPropertyOptional({ description: 'Hiring manager UUID' })
  @IsOptional()
  @IsUUID()
  hiringManagerId?: string;

  @ApiPropertyOptional({ description: 'Number of openings', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  openings?: number;

  @ApiPropertyOptional({ description: 'Closing date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  closingDate?: string;
}
