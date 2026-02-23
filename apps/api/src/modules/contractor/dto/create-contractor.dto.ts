import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsOptional,
  IsNumber,
  IsEmail,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator';

export enum ContractTypeDto {
  FIXED_PRICE = 'FIXED_PRICE',
  HOURLY = 'HOURLY',
  MILESTONE = 'MILESTONE',
}

export class CreateContractorDto {
  @ApiProperty({ description: 'First name', example: 'John' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ description: 'Email address', example: 'john@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Contractor company name', example: 'Acme LLC' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @ApiProperty({ enum: ContractTypeDto, description: 'Contract type', example: 'HOURLY' })
  @IsEnum(ContractTypeDto)
  contractType: ContractTypeDto;

  @ApiPropertyOptional({ description: 'Hourly rate (for HOURLY contracts)', example: 75.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiProperty({ description: 'Contract start date (YYYY-MM-DD)', example: '2026-03-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Contract end date (YYYY-MM-DD)', example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
