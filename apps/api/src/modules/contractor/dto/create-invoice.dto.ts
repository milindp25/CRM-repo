import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Invoice amount', example: 5000.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Invoice description', example: 'Development work for February 2026' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Billing period start date (YYYY-MM-DD)', example: '2026-02-01' })
  @IsDateString()
  periodStart: string;

  @ApiProperty({ description: 'Billing period end date (YYYY-MM-DD)', example: '2026-02-28' })
  @IsDateString()
  periodEnd: string;
}
