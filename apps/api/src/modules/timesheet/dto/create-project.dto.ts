import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, MaxLength, Min } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name', example: 'Client Portal Redesign' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Project code (unique per company)', example: 'CPR-2026' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ description: 'Client name', example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientName?: string;

  @ApiPropertyOptional({ description: 'Budget hours for the project', example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetHours?: number;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ description: 'Project name', example: 'Client Portal Redesign' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Client name', example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  clientName?: string;

  @ApiPropertyOptional({ description: 'Budget hours for the project', example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetHours?: number;

  @ApiPropertyOptional({ description: 'Whether the project is active', example: true })
  @IsOptional()
  isActive?: boolean;
}
