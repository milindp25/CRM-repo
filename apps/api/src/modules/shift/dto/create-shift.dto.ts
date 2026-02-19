import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateShiftDto {
  @ApiProperty({ description: 'Shift name', example: 'Morning Shift' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Unique shift code', example: 'MORNING' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ description: 'Shift description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Hex color for UI', example: '#3B82F6' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex color (e.g. #3B82F6)' })
  color?: string;

  @ApiProperty({ description: 'Start time in HH:mm format', example: '09:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'startTime must be in HH:mm format' })
  startTime: string;

  @ApiProperty({ description: 'End time in HH:mm format', example: '17:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must be in HH:mm format' })
  endTime: string;

  @ApiPropertyOptional({ description: 'Break duration in minutes', default: 60 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(480)
  breakDuration?: number;

  @ApiPropertyOptional({ description: 'Whether shift crosses midnight', default: false })
  @IsOptional()
  @IsBoolean()
  isOvernight?: boolean;

  @ApiPropertyOptional({ description: 'Grace period in minutes', default: 15 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  graceMinutes?: number;

  @ApiPropertyOptional({ description: 'Whether shift is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
