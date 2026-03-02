import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  Length,
  MaxLength,
  IsBoolean,
} from 'class-validator';

/**
 * Create Department DTO
 * Validation for creating a new department
 */
export class CreateDepartmentDto {
  @ApiProperty({
    example: 'Engineering',
    description: 'Department name',
    maxLength: 100,
  })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiPropertyOptional({
    example: 'ENG',
    description: 'Unique department code within the company. Auto-generated from name if not provided.',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({
    example: 'Responsible for all software development and engineering operations',
    description: 'Department description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'UUID of parent department (for hierarchical structure)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'UUID of the employee who heads this department',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  headEmployeeId?: string;

  @ApiPropertyOptional({
    example: 'CC-ENG-001',
    description: 'Cost center code for accounting',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  costCenter?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the department is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
