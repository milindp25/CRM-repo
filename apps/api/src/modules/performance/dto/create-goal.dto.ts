import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
  IsNumber,
  IsArray,
  IsObject,
  MaxLength,
  Length,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum GoalCategory {
  INDIVIDUAL = 'INDIVIDUAL',
  TEAM = 'TEAM',
  COMPANY = 'COMPANY',
}

export enum GoalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class CreateGoalDto {
  @ApiProperty({
    example: 'Improve API response time by 30%',
    description: 'Title of the goal',
    maxLength: 255,
  })
  @IsString()
  @Length(1, 255)
  title: string;

  @ApiPropertyOptional({
    example: 'Optimize database queries and implement caching to reduce P95 latency',
    description: 'Detailed description of the goal',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    example: 'INDIVIDUAL',
    enum: GoalCategory,
    description: 'Category of the goal',
  })
  @IsOptional()
  @IsEnum(GoalCategory)
  category?: GoalCategory;

  @ApiProperty({
    example: 'MEDIUM',
    enum: GoalPriority,
    default: 'MEDIUM',
    description: 'Priority level of the goal',
  })
  @IsEnum(GoalPriority)
  priority: GoalPriority;

  @ApiPropertyOptional({
    example: '2025-01-01',
    description: 'Start date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2025-03-31',
    description: 'Due date (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({
    example: 0.25,
    description: 'Weightage for scoring (0.0-1.0)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  weightage?: number;

  @ApiPropertyOptional({
    example: [{ title: 'Reduce P95 latency', targetValue: 200, currentValue: 0, unit: 'ms' }],
    description: 'Key results for the goal (OKR style)',
  })
  @IsOptional()
  @IsArray()
  keyResults?: Record<string, any>[];

  @ApiPropertyOptional({
    description: 'UUID of the employee this goal belongs to (admin can set for others)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({
    description: 'UUID of the performance review to link this goal to',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  reviewId?: string;
}
