import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsUUID, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { EmploymentType, EmployeeStatus } from './create-employee.dto';

export enum SortBy {
  CREATED_AT = 'createdAt',
  FIRST_NAME = 'firstName',
  EMPLOYEE_CODE = 'employeeCode',
  DATE_OF_JOINING = 'dateOfJoining',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class EmployeeFilterDto {
  // Search
  @ApiPropertyOptional({
    description: 'Search by name, email, or employee code (fuzzy match)',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  // Filters
  @ApiPropertyOptional({
    description: 'Filter by department UUID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by designation UUID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  designationId?: string;

  @ApiPropertyOptional({
    description: 'Filter by employment status',
    enum: EmployeeStatus,
  })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiPropertyOptional({
    description: 'Filter by employment type',
    enum: EmploymentType,
  })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({
    description: 'Filter by reporting manager UUID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  reportingManagerId?: string;

  // Pagination
  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // Sorting
  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: SortBy,
    default: SortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(SortBy)
  sortBy?: SortBy = SortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}
