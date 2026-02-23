import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsInt,
  MaxLength,
} from 'class-validator';

export class AdjustBalanceDto {
  @ApiProperty({ description: 'Employee ID', example: 'uuid' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Leave type code', example: 'CASUAL' })
  @IsString()
  @MaxLength(50)
  leaveType: string;

  @ApiPropertyOptional({
    description: 'Fiscal year (defaults to current year)',
    example: 2026,
  })
  @IsOptional()
  @IsInt()
  fiscalYear?: number;

  @ApiProperty({
    description: 'Adjustment amount (positive to add, negative to deduct)',
    example: 2,
  })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({
    description: 'Reason for adjustment',
    example: 'Compensatory leave for weekend work',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
