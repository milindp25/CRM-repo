import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum SalaryComponentType {
  EARNING = 'EARNING',
  DEDUCTION = 'DEDUCTION',
}

export enum CalculationType {
  FIXED = 'FIXED',
  PERCENTAGE_OF_BASIC = 'PERCENTAGE_OF_BASIC',
  PERCENTAGE_OF_GROSS = 'PERCENTAGE_OF_GROSS',
}

export enum SalaryStructureCountry {
  IN = 'IN',
  US = 'US',
}

// ─── Nested component DTO ─────────────────────────────────────────────────────

export class SalaryComponentDto {
  @ApiProperty({ description: 'Component name', example: 'Basic Salary' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: SalaryComponentType, example: 'EARNING' })
  @IsEnum(SalaryComponentType)
  type: SalaryComponentType;

  @ApiProperty({ enum: CalculationType, example: 'FIXED' })
  @IsEnum(CalculationType)
  calculationType: CalculationType;

  @ApiProperty({ description: 'Value (fixed amount or percentage)', example: 50 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ description: 'Whether this component is taxable', example: true })
  @IsBoolean()
  isTaxable: boolean;
}

// ─── Create DTO ───────────────────────────────────────────────────────────────

export class CreateSalaryStructureDto {
  @ApiProperty({ description: 'Salary structure name', example: 'Standard India CTC' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Description of the salary structure' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: SalaryStructureCountry, description: 'Country code', example: 'IN' })
  @IsEnum(SalaryStructureCountry)
  country: SalaryStructureCountry;

  @ApiProperty({ type: [SalaryComponentDto], description: 'Salary components' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalaryComponentDto)
  components: SalaryComponentDto[];

  @ApiPropertyOptional({ description: 'Designation UUID to link this structure to' })
  @IsOptional()
  @IsUUID()
  designationId?: string;
}

// ─── Update DTO ───────────────────────────────────────────────────────────────

export class UpdateSalaryStructureDto {
  @ApiPropertyOptional({ description: 'Salary structure name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Description of the salary structure' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: SalaryStructureCountry, description: 'Country code' })
  @IsOptional()
  @IsEnum(SalaryStructureCountry)
  country?: SalaryStructureCountry;

  @ApiPropertyOptional({ type: [SalaryComponentDto], description: 'Salary components' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalaryComponentDto)
  components?: SalaryComponentDto[];

  @ApiPropertyOptional({ description: 'Designation UUID to link this structure to' })
  @IsOptional()
  @IsUUID()
  designationId?: string;

  @ApiPropertyOptional({ description: 'Whether this structure is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ─── Response DTO ─────────────────────────────────────────────────────────────

export class SalaryStructureResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() companyId: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() country: string;
  @ApiProperty({ type: [SalaryComponentDto] }) components: SalaryComponentDto[];
  @ApiPropertyOptional() designationId?: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
