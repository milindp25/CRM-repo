import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PayrollResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  payPeriodMonth: number;

  @ApiProperty()
  payPeriodYear: number;

  @ApiPropertyOptional()
  payDate?: string;

  // Decrypted salary components (only for authorized roles)
  @ApiProperty()
  basicSalary: number;

  @ApiPropertyOptional()
  hra?: number;

  @ApiPropertyOptional()
  specialAllowance?: number;

  @ApiPropertyOptional()
  otherAllowances?: number;

  @ApiProperty()
  grossSalary: number;

  @ApiProperty()
  netSalary: number;

  // Deductions
  @ApiProperty()
  pfEmployee: number;

  @ApiProperty()
  pfEmployer: number;

  @ApiProperty()
  esiEmployee: number;

  @ApiProperty()
  esiEmployer: number;

  @ApiProperty()
  tds: number;

  @ApiProperty()
  pt: number;

  @ApiProperty()
  otherDeductions: number;

  // Attendance
  @ApiProperty()
  daysWorked: number;

  @ApiProperty()
  daysInMonth: number;

  @ApiProperty()
  leaveDays: number;

  @ApiProperty()
  absentDays: number;

  @ApiProperty()
  overtimeHours: number;

  // Bank details (decrypted for authorized roles)
  @ApiPropertyOptional()
  bankAccount?: string;

  @ApiPropertyOptional()
  ifscCode?: string;

  @ApiPropertyOptional()
  bankName?: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  paidAt?: Date;

  @ApiPropertyOptional()
  payslipPath?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: () => Object })
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  };
}

export class PayrollPaginationResponseDto {
  @ApiProperty({ type: [PayrollResponseDto] })
  data: PayrollResponseDto[];

  @ApiProperty()
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
