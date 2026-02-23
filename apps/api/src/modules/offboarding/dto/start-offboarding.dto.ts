import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';

export enum SeparationTypeDto {
  RESIGNATION = 'RESIGNATION',
  TERMINATION = 'TERMINATION',
  RETIREMENT = 'RETIREMENT',
  CONTRACT_END = 'CONTRACT_END',
  LAYOFF = 'LAYOFF',
}

export class StartOffboardingDto {
  @ApiProperty({ description: 'Employee UUID to offboard' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({
    enum: SeparationTypeDto,
    description: 'Reason for separation',
    example: 'RESIGNATION',
  })
  @IsEnum(SeparationTypeDto)
  separationType: SeparationTypeDto;

  @ApiProperty({
    description: 'Last working day (YYYY-MM-DD)',
    example: '2026-03-31',
  })
  @IsDateString()
  lastWorkingDay: string;

  @ApiPropertyOptional({
    description: 'Checklist template UUID to use for generating tasks',
  })
  @IsOptional()
  @IsUUID()
  checklistId?: string;

  @ApiPropertyOptional({ description: 'Notice period in days' })
  @IsOptional()
  @IsInt()
  @Min(0)
  noticePeriodDays?: number;
}
