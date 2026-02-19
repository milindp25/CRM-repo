import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsInt, Min } from 'class-validator';

export class CreateBillingPlanDto {
  @ApiProperty({ example: 'Standard Plan', description: 'Plan name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'BASIC', description: 'Subscription tier' })
  @IsString()
  tier: string;

  @ApiProperty({ example: 29.99, description: 'Monthly base price' })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ example: 299.99, description: 'Yearly base price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  yearlyBasePrice?: number;

  @ApiProperty({ example: 2.50, description: 'Price per employee per month' })
  @IsNumber()
  @Min(0)
  pricePerEmployee: number;

  @ApiProperty({ example: 5.00, description: 'Price per user per month' })
  @IsNumber()
  @Min(0)
  pricePerUser: number;

  @ApiPropertyOptional({ example: 10, description: 'Employees included in base price' })
  @IsOptional()
  @IsInt()
  @Min(0)
  includedEmployees?: number;

  @ApiPropertyOptional({ example: 5, description: 'Users included in base price' })
  @IsOptional()
  @IsInt()
  @Min(0)
  includedUsers?: number;
}
