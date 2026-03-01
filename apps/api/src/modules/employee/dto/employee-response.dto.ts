import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { EmploymentType, EmployeeStatus, Gender } from './create-employee.dto';

// Nested relation DTOs
export class DepartmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;
}

export class DesignationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  level: number;
}

export class ManagerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  employeeCode: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  workEmail: string;
}

export class EmployeeResponseDto {
  @ApiProperty({
    description: 'Employee UUID',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Company UUID',
    format: 'uuid',
  })
  companyId: string;

  // Employee identification
  @ApiProperty({
    example: 'EMP001',
  })
  employeeCode: string;

  // Personal information
  @ApiProperty({
    example: 'John',
  })
  firstName: string;

  @ApiPropertyOptional({
    example: 'Michael',
  })
  middleName?: string;

  @ApiProperty({
    example: 'Doe',
  })
  lastName: string;

  @ApiPropertyOptional({
    example: '1990-05-15',
  })
  dateOfBirth?: string;

  @ApiPropertyOptional({
    enum: Gender,
  })
  gender?: string;

  // Contact (work)
  @ApiProperty({
    example: 'john.doe@company.com',
  })
  workEmail: string;

  @ApiPropertyOptional({
    example: '+91-9876543210',
  })
  workPhone?: string;

  // Contact (personal) - Only included for authorized roles
  @ApiPropertyOptional({
    example: 'john.personal@gmail.com',
    description: 'Only visible to HR_ADMIN and COMPANY_ADMIN',
  })
  personalEmail?: string;

  @ApiPropertyOptional({
    example: '+91-9876543211',
    description: 'Only visible to HR_ADMIN and COMPANY_ADMIN',
  })
  personalPhone?: string;

  // Government IDs - Only included for authorized roles
  @ApiPropertyOptional({
    example: '123456789012',
    description: 'Only visible to HR_ADMIN and COMPANY_ADMIN',
  })
  aadhaar?: string;

  @ApiPropertyOptional({
    example: 'ABCDE1234F',
    description: 'Only visible to HR_ADMIN and COMPANY_ADMIN',
  })
  pan?: string;

  @ApiPropertyOptional({
    example: 'A1234567',
    description: 'Only visible to HR_ADMIN and COMPANY_ADMIN',
  })
  passport?: string;

  // Exclude encrypted fields from response
  @Exclude()
  personalEmailEncrypted?: string;

  @Exclude()
  personalPhoneEncrypted?: string;

  @Exclude()
  aadhaarEncrypted?: string;

  @Exclude()
  panEncrypted?: string;

  @Exclude()
  passportEncrypted?: string;

  // Address
  @ApiPropertyOptional()
  addressLine1?: string;

  @ApiPropertyOptional()
  addressLine2?: string;

  @ApiPropertyOptional()
  city?: string;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  country?: string;

  @ApiPropertyOptional()
  postalCode?: string;

  // Employment
  @ApiProperty({
    example: '2024-01-15',
  })
  dateOfJoining: string;

  @ApiPropertyOptional({
    example: '2024-12-31',
  })
  dateOfLeaving?: string;

  @ApiPropertyOptional({
    example: '2024-07-15',
  })
  probationEndDate?: string;

  @ApiPropertyOptional({
    format: 'uuid',
  })
  departmentId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
  })
  designationId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
  })
  reportingManagerId?: string;

  @ApiPropertyOptional({
    description: 'Employee photo URL/path',
  })
  photoUrl?: string;

  @ApiProperty({
    enum: EmploymentType,
  })
  employmentType: string;

  @ApiProperty({
    enum: EmployeeStatus,
  })
  status: string;

  @ApiProperty()
  isActive: boolean;

  // Relations
  @ApiPropertyOptional({ type: DepartmentResponseDto })
  department?: DepartmentResponseDto;

  @ApiPropertyOptional({ type: DesignationResponseDto })
  designation?: DesignationResponseDto;

  @ApiPropertyOptional({ type: ManagerResponseDto })
  reportingManager?: ManagerResponseDto;

  // Timestamps
  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date;
}
