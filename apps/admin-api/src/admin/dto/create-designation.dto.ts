import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsInt, MaxLength, Min } from 'class-validator';

export class CreateDesignationDto {
  @ApiProperty({ example: 'Senior Software Engineer', description: 'Designation title' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'SSE', description: 'Designation code (unique within company)' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ example: 5, description: 'Designation level (higher = more senior)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  level?: number;

  @ApiPropertyOptional({ example: 'Senior engineering role', description: 'Description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 80000, description: 'Minimum salary for this designation' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSalary?: number;

  @ApiPropertyOptional({ example: 150000, description: 'Maximum salary for this designation' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxSalary?: number;

  @ApiPropertyOptional({ example: 'USD', description: 'Salary currency code' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;
}
