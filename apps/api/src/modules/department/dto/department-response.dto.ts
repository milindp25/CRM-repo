import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Department Response DTO
 * Formatted response with nested relations
 */
export class DepartmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Parent department (if exists)',
    type: () => Object,
  })
  parent?: {
    id: string;
    name: string;
    code: string;
  } | null;

  @ApiPropertyOptional({
    description: 'Child departments',
    type: () => Array,
  })
  children?: {
    id: string;
    name: string;
    code: string;
  }[];

  @ApiPropertyOptional({
    description: 'Department head employee',
    type: () => Object,
  })
  headEmployee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  } | null;

  @ApiPropertyOptional()
  costCenter?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date | null;

  @ApiPropertyOptional({
    description: 'Number of employees in this department',
  })
  employeeCount?: number;
}

/**
 * Paginated Department Response
 */
export class DepartmentPaginationResponseDto {
  @ApiProperty({ type: [DepartmentResponseDto] })
  data: DepartmentResponseDto[];

  @ApiProperty({
    example: {
      currentPage: 1,
      itemsPerPage: 20,
      totalItems: 50,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false,
    },
  })
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
