import { IsString, IsNumber, IsEnum, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AdjustmentType {
  EARNING = 'EARNING',
  DEDUCTION = 'DEDUCTION',
}

export class PayrollAdjustmentDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: AdjustmentType })
  @IsEnum(AdjustmentType)
  type: AdjustmentType;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AddAdjustmentsDto {
  @ApiProperty({ type: [PayrollAdjustmentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PayrollAdjustmentDto)
  adjustments: PayrollAdjustmentDto[];
}
