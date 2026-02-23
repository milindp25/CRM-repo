import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, IsNumberString } from 'class-validator';

export class TimesheetFilterDto {
  @ApiPropertyOptional({ description: 'Filter by status (DRAFT, SUBMITTED, APPROVED, REJECTED)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by employee UUID' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: '1' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ description: 'Items per page', default: '20' })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}
