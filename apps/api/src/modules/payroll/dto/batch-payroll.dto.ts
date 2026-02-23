import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsEnum, IsUUID, IsNumber, IsArray, Min, Max } from 'class-validator';

export class BatchPayrollDto {
  @ApiProperty({ example: 2, description: 'Pay period month (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 2026, description: 'Pay period year' })
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;
}

export class ProcessBonusDto {
  @ApiProperty({ description: 'Employee ID(s) to process bonus for' })
  @IsArray()
  @IsUUID('4', { each: true })
  employeeIds: string[];

  @ApiProperty({ enum: ['FIXED_AMOUNT', 'PERCENTAGE_OF_BASIC', 'PERCENTAGE_OF_CTC'], description: 'Bonus calculation type' })
  @IsEnum(['FIXED_AMOUNT', 'PERCENTAGE_OF_BASIC', 'PERCENTAGE_OF_CTC'])
  bonusType: string;

  @ApiProperty({ example: 50000, description: 'Bonus amount (fixed) or percentage value' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Reason or notes for the bonus' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReconcileDto {
  @ApiProperty({ example: 2, description: 'Month to reconcile (1-12)' })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ example: 2026, description: 'Year to reconcile' })
  @IsInt()
  @Min(2020)
  @Max(2100)
  year: number;
}

export class SubmitApprovalDto {
  @ApiPropertyOptional({ description: 'Optional notes for the approval request' })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ─── Response DTOs ──────────────────────────────────────────────────────────────

export class BatchStatusResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() companyId: string;
  @ApiProperty() month: number;
  @ApiProperty() year: number;
  @ApiProperty() status: string;
  @ApiProperty() totalCount: number;
  @ApiProperty() processedCount: number;
  @ApiProperty() failedCount: number;
  @ApiPropertyOptional() errors?: Array<{ employeeId: string; error: string }>;
  @ApiProperty() initiatedBy: string;
  @ApiPropertyOptional() completedAt?: Date;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class ReconciliationResponseDto {
  @ApiProperty() currentMonth: { month: number; year: number };
  @ApiProperty() previousMonth: { month: number; year: number };
  @ApiProperty() summary: {
    totalPayrollVariance: number;
    totalPayrollVariancePercent: number;
    headcountChange: number;
    averageSalaryChange: number;
  };
  @ApiProperty() anomalies: Array<{
    type: 'MISSING' | 'NEW' | 'SALARY_CHANGE' | 'DEDUCTION_CHANGE';
    employeeId: string;
    employeeName: string;
    detail: string;
    previousAmount?: number;
    currentAmount?: number;
    changePercent?: number;
  }>;
}

export class YtdResponseDto {
  @ApiProperty() employeeId: string;
  @ApiProperty() fiscalYear: number;
  @ApiProperty() grossEarningsEncrypted: string;
  @ApiProperty() totalDeductionsEncrypted: string;
  @ApiProperty() taxPaidEncrypted: string;
  @ApiPropertyOptional() pfEmployeeYtd?: number;
  @ApiPropertyOptional() pfEmployerYtd?: number;
  @ApiPropertyOptional() esiEmployeeYtd?: number;
  @ApiPropertyOptional() esiEmployerYtd?: number;
  @ApiPropertyOptional() tdsYtd?: number;
  @ApiPropertyOptional() ptYtd?: number;
  @ApiPropertyOptional() ssEmployeeYtd?: number;
  @ApiPropertyOptional() ssEmployerYtd?: number;
  @ApiPropertyOptional() medicareYtd?: number;
  @ApiPropertyOptional() federalTaxYtd?: number;
  @ApiPropertyOptional() stateTaxYtd?: number;
}

export class MyPayslipResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() payPeriodMonth: number;
  @ApiProperty() payPeriodYear: number;
  @ApiPropertyOptional() payDate?: string;
  @ApiProperty() grossSalary: number;
  @ApiProperty() netSalary: number;
  @ApiProperty() totalDeductions: number;
  @ApiProperty() status: string;
  @ApiProperty() country: string;
  @ApiPropertyOptional() earningsBreakdown?: Record<string, number>;
  @ApiPropertyOptional() deductionsBreakdown?: Record<string, number>;
  @ApiPropertyOptional() employerContributions?: Record<string, number>;
  @ApiPropertyOptional() computationBreakdown?: Record<string, any>;
  @ApiPropertyOptional() paidAt?: Date;
}

export class MyPayslipHistoryResponseDto {
  @ApiProperty({ type: [MyPayslipResponseDto] }) data: MyPayslipResponseDto[];
  @ApiProperty() hasArchive: boolean;
  @ApiProperty() totalRecords: number;
}
