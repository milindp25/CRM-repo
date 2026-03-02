import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUUID,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  ON_NOTICE = 'ON_NOTICE',
  RESIGNED = 'RESIGNED',
  TERMINATED = 'TERMINATED',
  ON_LEAVE = 'ON_LEAVE',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export class CreateEmployeeDto {
  // Employee identification
  @ApiPropertyOptional({
    example: 'EMP001',
    description: 'Unique employee code within the company. Auto-generated (EMP-001 format) if not provided.',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  employeeCode?: string;

  // Personal information (Required)
  @ApiProperty({ example: 'John', maxLength: 100 })
  @IsString()
  @Length(1, 100)
  firstName: string;

  @ApiPropertyOptional({ example: 'Michael', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  middleName?: string;

  @ApiProperty({ example: 'Doe', maxLength: 100 })
  @IsString()
  @Length(1, 100)
  lastName: string;

  @ApiPropertyOptional({
    example: '1990-05-15',
    description: 'Date of birth in ISO format (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: 'MALE',
    enum: Gender,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  // Contact (work) - Required
  @ApiProperty({
    example: 'john.doe@company.com',
    description: 'Official work email address',
  })
  @IsEmail()
  @MaxLength(255)
  workEmail: string;

  @ApiPropertyOptional({
    example: '+91-9876543210',
    description: 'Official work phone number',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  workPhone?: string;

  // Contact (personal) - Will be encrypted
  @ApiPropertyOptional({
    example: 'john.doe.personal@gmail.com',
    description: 'Personal email (will be encrypted)',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  personalEmail?: string;

  @ApiPropertyOptional({
    example: '+91-9876543211',
    description: 'Personal phone number (will be encrypted)',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  personalPhone?: string;

  // Government IDs - Will be encrypted
  @ApiPropertyOptional({
    example: '123456789012',
    description: 'Aadhaar number (12 digits, will be encrypted)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{12}$/, { message: 'Aadhaar must be exactly 12 digits' })
  aadhaar?: string;

  @ApiPropertyOptional({
    example: 'ABCDE1234F',
    description: 'PAN number (format: ABCDE1234F, will be encrypted)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: 'PAN must be in format: ABCDE1234F'
  })
  pan?: string;

  @ApiPropertyOptional({
    example: 'A1234567',
    description: 'Passport number (will be encrypted)',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  passport?: string;

  // Address
  @ApiPropertyOptional({
    example: '123 Main Street',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine1?: string;

  @ApiPropertyOptional({
    example: 'Apartment 4B',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @ApiPropertyOptional({
    example: 'Mumbai',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    example: 'Maharashtra',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({
    example: 'India',
    maxLength: 100,
    default: 'India',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    example: '400001',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  // Employment (Required)
  @ApiProperty({
    example: '2024-01-15',
    description: 'Date of joining in ISO format (YYYY-MM-DD)',
  })
  @IsDateString()
  dateOfJoining: string;

  @ApiPropertyOptional({
    example: '2024-12-31',
    description: 'Date of leaving in ISO format (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  dateOfLeaving?: string;

  @ApiPropertyOptional({
    example: '2024-07-15',
    description: 'Probation end date in ISO format (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsDateString()
  probationEndDate?: string;

  @ApiPropertyOptional({
    description: 'UUID of the department',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({
    description: 'UUID of the designation',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  designationId?: string;

  @ApiPropertyOptional({
    description: 'UUID of the reporting manager (must be an existing employee)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  reportingManagerId?: string;

  // Employment type (Required)
  @ApiProperty({
    example: 'FULL_TIME',
    enum: EmploymentType,
    default: 'FULL_TIME',
  })
  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  // Status (Optional, defaults to ACTIVE in DB)
  @ApiPropertyOptional({
    example: 'ACTIVE',
    enum: EmployeeStatus,
    default: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
