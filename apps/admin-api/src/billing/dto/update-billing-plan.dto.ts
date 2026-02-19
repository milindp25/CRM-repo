import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateBillingPlanDto {
  @ApiPropertyOptional({ description: 'Plan name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Monthly base price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({ description: 'Yearly base price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  yearlyBasePrice?: number;

  @ApiPropertyOptional({ description: 'Price per employee per month' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerEmployee?: number;

  @ApiPropertyOptional({ description: 'Price per user per month' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerUser?: number;

  @ApiPropertyOptional({ description: 'Employees included in base price' })
  @IsOptional()
  @IsInt()
  @Min(0)
  includedEmployees?: number;

  @ApiPropertyOptional({ description: 'Users included in base price' })
  @IsOptional()
  @IsInt()
  @Min(0)
  includedUsers?: number;

  @ApiPropertyOptional({ description: 'Whether plan is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
