import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class ProcessPayrollDto {
  @ApiPropertyOptional({ description: 'Notes about processing' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class MarkPaidDto {
  @ApiPropertyOptional({ example: '2024-02-28', description: 'Payment date' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ description: 'Payment reference or notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
