import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeaveResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  leaveType: string;

  @ApiProperty()
  startDate: string;

  @ApiProperty()
  endDate: string;

  @ApiProperty()
  totalDays: number;

  @ApiProperty()
  isHalfDay: boolean;

  @ApiPropertyOptional()
  halfDayType?: string;

  @ApiProperty()
  reason: string;

  @ApiPropertyOptional()
  contactDuringLeave?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  appliedAt: Date;

  @ApiPropertyOptional()
  approvedBy?: string;

  @ApiPropertyOptional()
  approvedAt?: Date;

  @ApiPropertyOptional()
  approvalNotes?: string;

  @ApiPropertyOptional()
  cancelledAt?: Date;

  @ApiPropertyOptional()
  cancellationReason?: string;

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

export class LeavePaginationResponseDto {
  @ApiProperty({ type: [LeaveResponseDto] })
  data: LeaveResponseDto[];

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
