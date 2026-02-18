import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsBoolean, IsEnum, IsOptional, IsNumber, Min, IsUUID } from 'class-validator';

export enum LeaveType {
  CASUAL = 'CASUAL',
  SICK = 'SICK',
  EARNED = 'EARNED',
  PRIVILEGE = 'PRIVILEGE',
  MATERNITY = 'MATERNITY',
  PATERNITY = 'PATERNITY',
  COMPENSATORY = 'COMPENSATORY',
  LOSS_OF_PAY = 'LOSS_OF_PAY',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum HalfDayType {
  FIRST_HALF = 'FIRST_HALF',
  SECOND_HALF = 'SECOND_HALF',
}

export class CreateLeaveDto {
  @ApiProperty({ description: 'Employee UUID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ enum: LeaveType, example: 'CASUAL' })
  @IsEnum(LeaveType)
  leaveType: LeaveType;

  @ApiProperty({ example: '2024-02-15', description: 'Leave start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-02-16', description: 'Leave end date (YYYY-MM-DD)' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 2, description: 'Total number of days (supports decimals for half-day)' })
  @IsNumber()
  @Min(0.5)
  totalDays: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isHalfDay?: boolean;

  @ApiPropertyOptional({ enum: HalfDayType })
  @IsOptional()
  @IsEnum(HalfDayType)
  halfDayType?: HalfDayType;

  @ApiProperty({ description: 'Reason for leave' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Contact number during leave' })
  @IsOptional()
  @IsString()
  contactDuringLeave?: string;
}
