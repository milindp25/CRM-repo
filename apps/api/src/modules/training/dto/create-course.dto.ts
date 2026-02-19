import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsDateString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';

export enum CourseCategory {
  TECHNICAL = 'TECHNICAL',
  COMPLIANCE = 'COMPLIANCE',
  SOFT_SKILLS = 'SOFT_SKILLS',
  ONBOARDING = 'ONBOARDING',
  LEADERSHIP = 'LEADERSHIP',
}

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateCourseDto {
  @ApiProperty({ description: 'Course title', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Course description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: CourseCategory,
    description: 'Course category',
    example: CourseCategory.TECHNICAL,
  })
  @IsOptional()
  @IsEnum(CourseCategory)
  category?: string;

  @ApiPropertyOptional({ description: 'Instructor name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  instructor?: string;

  @ApiPropertyOptional({ description: 'External content URL' })
  @IsOptional()
  @IsUrl()
  contentUrl?: string;

  @ApiPropertyOptional({ description: 'Duration in hours', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ description: 'Course start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Course end date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Maximum enrollments allowed', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxEnrollments?: number;

  @ApiPropertyOptional({ description: 'Whether the course is mandatory', default: false })
  @IsOptional()
  @IsBoolean()
  isMandatory?: boolean;

  @ApiPropertyOptional({
    enum: CourseStatus,
    description: 'Course status',
    default: CourseStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: string;
}
