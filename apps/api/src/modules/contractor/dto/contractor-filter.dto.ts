import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class ContractorFilterDto {
  @ApiPropertyOptional({ description: 'Filter by status (ACTIVE, INACTIVE, TERMINATED)', example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Page number', example: '1' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ description: 'Items per page', example: '20' })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}
