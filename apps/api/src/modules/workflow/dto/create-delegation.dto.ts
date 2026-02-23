import { IsString, IsUUID, IsDateString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDelegationDto {
  @ApiProperty({ description: 'User ID to delegate approvals to' })
  @IsUUID()
  delegateId: string;

  @ApiProperty({ description: 'Start date (ISO 8601)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date (ISO 8601)' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Reason for delegation' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Scope of delegation (entity types)',
    example: ['LEAVE', 'EXPENSE'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scope?: string[];
}
