import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { LeaveAccrualTypeDto } from './create-policy.dto';

export class UpdatePolicyDto {
  @ApiPropertyOptional({ description: 'Policy name', example: 'Casual Leave' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Annual entitlement in days', example: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  annualEntitlement?: number;

  @ApiPropertyOptional({
    enum: LeaveAccrualTypeDto,
    description: 'How leave accrues',
    example: 'MONTHLY_ACCRUAL',
  })
  @IsOptional()
  @IsEnum(LeaveAccrualTypeDto)
  accrualType?: LeaveAccrualTypeDto;

  @ApiPropertyOptional({
    description: 'Max days that can carry over to next fiscal year',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  carryoverLimit?: number;

  @ApiPropertyOptional({
    description: 'Months after which carried-over balance expires',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  carryoverExpiryMonths?: number;

  @ApiPropertyOptional({
    description: 'Maximum consecutive days allowed in a single leave request',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxConsecutiveDays?: number;

  @ApiPropertyOptional({
    description: 'Minimum service days before employee is eligible',
    example: 90,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minServiceDaysRequired?: number;

  @ApiPropertyOptional({
    description: 'Gender restriction (null = all)',
    example: 'FEMALE',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  applicableGender?: string;

  @ApiPropertyOptional({ description: 'Whether the policy is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Fiscal year start month (1-12)',
    example: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  fiscalYearStart?: number;
}
