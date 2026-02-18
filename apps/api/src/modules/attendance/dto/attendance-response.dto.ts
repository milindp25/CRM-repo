import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttendanceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  employeeId: string;

  @ApiProperty()
  attendanceDate: string;

  @ApiPropertyOptional()
  checkInTime?: string;

  @ApiPropertyOptional()
  checkOutTime?: string;

  @ApiPropertyOptional()
  totalHours?: number;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  isWorkFromHome?: boolean;

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

export class AttendancePaginationResponseDto {
  @ApiProperty({ type: [AttendanceResponseDto] })
  data: AttendanceResponseDto[];

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
