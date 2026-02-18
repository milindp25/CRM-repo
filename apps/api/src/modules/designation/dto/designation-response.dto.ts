import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DesignationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  level: number;

  @ApiPropertyOptional()
  minSalary?: number;

  @ApiPropertyOptional()
  maxSalary?: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date | null;

  @ApiPropertyOptional()
  employeeCount?: number;
}

export class DesignationPaginationResponseDto {
  @ApiProperty({ type: [DesignationResponseDto] })
  data: DesignationResponseDto[];

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
