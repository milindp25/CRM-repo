import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTimesheetDto {
  @ApiProperty({
    description: 'Start date of the week (YYYY-MM-DD). Will be normalized to Monday.',
    example: '2026-02-16',
  })
  @IsDateString()
  weekStartDate: string;

  @ApiPropertyOptional({ description: 'Employee UUID (admin can create on behalf)' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Notes for the timesheet' })
  @IsOptional()
  @IsString()
  notes?: string;
}
