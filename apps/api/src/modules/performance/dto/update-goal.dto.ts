import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
  IsNumber,
  IsArray,
  MaxLength,
  Length,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GoalCategory, GoalPriority } from './create-goal.dto';

export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class UpdateGoalDto {
  @ApiPropertyOptional({
    example: 'Improve API response time by 30%',
    description: 'Title of the goal',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;

  @ApiPropertyOptional({
    example: 'Optimize database queries and implement caching',
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

  @ApiPropertyOptional({
    example: 'HIGH',
    enum: GoalPriority,
    description: 'Priority level of the goal',
  })
  @IsOptional()
  @IsEnum(GoalPriority)
  priority?: GoalPriority;

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
    example: [{ title: 'Reduce P95 latency', targetValue: 200, currentValue: 150, unit: 'ms' }],
    description: 'Key results for the goal (OKR style)',
  })
  @IsOptional()
  @IsArray()
  keyResults?: Record<string, any>[];

  @ApiPropertyOptional({
    example: 'IN_PROGRESS',
    enum: GoalStatus,
    description: 'Current status of the goal',
  })
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @ApiPropertyOptional({
    description: 'UUID of the performance review to link this goal to',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  reviewId?: string;
}
