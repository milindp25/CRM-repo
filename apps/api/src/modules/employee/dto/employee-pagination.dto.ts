import { ApiProperty } from '@nestjs/swagger';
import { EmployeeResponseDto } from './employee-response.dto';

export class PaginationMeta {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  itemsPerPage: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 150,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPreviousPage: boolean;
}

export class EmployeePaginationResponseDto {
  @ApiProperty({
    type: [EmployeeResponseDto],
    description: 'Array of employees',
  })
  data: EmployeeResponseDto[];

  @ApiProperty({
    type: PaginationMeta,
    description: 'Pagination metadata',
  })
  meta: PaginationMeta;
}
