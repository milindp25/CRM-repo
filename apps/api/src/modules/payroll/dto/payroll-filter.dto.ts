import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PayrollStatus } from './create-payroll.dto';

export class PayrollFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Pay period month (1-12)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  payPeriodMonth?: number;

  @ApiPropertyOptional({ description: 'Pay period year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  payPeriodYear?: number;

  @ApiPropertyOptional({ enum: PayrollStatus })
  @IsOptional()
  @IsEnum(PayrollStatus)
  status?: PayrollStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
