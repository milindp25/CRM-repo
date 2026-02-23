import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  Min,
  Max,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { TimeEntryType } from './create-entry.dto';

export class UpdateEntryDto {
  @ApiPropertyOptional({ description: 'Date of the time entry (YYYY-MM-DD)', example: '2026-02-16' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Number of hours worked', example: 8.0 })
  @IsOptional()
  @IsNumber()
  @Min(0.25)
  @Max(24)
  hours?: number;

  @ApiPropertyOptional({ description: 'Project name (free text)', example: 'Client Portal' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  projectName?: string;

  @ApiPropertyOptional({ description: 'Description of the task performed' })
  @IsOptional()
  @IsString()
  taskDescription?: string;

  @ApiPropertyOptional({
    enum: TimeEntryType,
    description: 'Type of time entry',
  })
  @IsOptional()
  @IsEnum(TimeEntryType)
  entryType?: TimeEntryType;

  @ApiPropertyOptional({ description: 'Whether this entry is billable' })
  @IsOptional()
  @IsBoolean()
  isBillable?: boolean;

  @ApiPropertyOptional({ description: 'Project UUID (links to a project)' })
  @IsOptional()
  @IsUUID()
  projectId?: string;
}
