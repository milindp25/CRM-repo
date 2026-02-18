import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsNumber, IsOptional, IsEnum, IsDateString, Min, Max, IsUUID } from 'class-validator';

export enum PayrollStatus {
  DRAFT = 'DRAFT',
  PROCESSED = 'PROCESSED',
  PAID = 'PAID',
  HOLD = 'HOLD',
}

export class CreatePayrollDto {
  @ApiProperty({ description: 'Employee UUID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ example: 2, description: 'Pay period month (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  payPeriodMonth: number;

  @ApiProperty({ example: 2024, description: 'Pay period year' })
  @IsInt()
  @Min(2020)
  @Max(2100)
  payPeriodYear: number;

  @ApiPropertyOptional({ example: '2024-02-28', description: 'Payment date' })
  @IsOptional()
  @IsDateString()
  payDate?: string;

  // Salary components (will be encrypted)
  @ApiProperty({ example: 50000, description: 'Basic salary (will be encrypted)' })
  @IsNumber()
  @Min(0)
  basicSalary: number;

  @ApiPropertyOptional({ example: 15000, description: 'HRA (will be encrypted)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hra?: number;

  @ApiPropertyOptional({ example: 10000, description: 'Special allowance (will be encrypted)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  specialAllowance?: number;

  @ApiPropertyOptional({ example: 5000, description: 'Other allowances (will be encrypted)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherAllowances?: number;

  // Deductions
  @ApiPropertyOptional({ example: 1800, description: 'PF employee contribution' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pfEmployee?: number;

  @ApiPropertyOptional({ example: 1800, description: 'PF employer contribution' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pfEmployer?: number;

  @ApiPropertyOptional({ example: 750, description: 'ESI employee contribution' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  esiEmployee?: number;

  @ApiPropertyOptional({ example: 2500, description: 'ESI employer contribution' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  esiEmployer?: number;

  @ApiPropertyOptional({ example: 3000, description: 'TDS deduction' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tds?: number;

  @ApiPropertyOptional({ example: 200, description: 'Professional tax' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pt?: number;

  @ApiPropertyOptional({ example: 500, description: 'Other deductions' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherDeductions?: number;

  // Attendance
  @ApiProperty({ example: 26, description: 'Days worked in month' })
  @IsInt()
  @Min(0)
  daysWorked: number;

  @ApiProperty({ example: 30, description: 'Total days in month' })
  @IsInt()
  @Min(28)
  @Max(31)
  daysInMonth: number;

  @ApiPropertyOptional({ example: 2, description: 'Leave days' })
  @IsOptional()
  @IsInt()
  @Min(0)
  leaveDays?: number;

  @ApiPropertyOptional({ example: 2, description: 'Absent days' })
  @IsOptional()
  @IsInt()
  @Min(0)
  absentDays?: number;

  @ApiPropertyOptional({ example: 5, description: 'Overtime hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeHours?: number;

  // Bank details (will be encrypted)
  @ApiPropertyOptional({ description: 'Bank account number (will be encrypted)' })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiPropertyOptional({ description: 'IFSC code (will be encrypted)' })
  @IsOptional()
  @IsString()
  ifscCode?: string;

  @ApiPropertyOptional({ description: 'Bank name' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
