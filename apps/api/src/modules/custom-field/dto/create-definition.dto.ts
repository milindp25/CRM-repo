import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsArray,
  ValidateNested,
  Matches,
  ValidateIf,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomFieldType, CustomFieldEntityType } from '@hrplatform/shared';

class SelectOptionDto {
  @ApiProperty({ description: 'Option value (stored in database)', example: 'option_1' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ description: 'Option display label', example: 'Option 1' })
  @IsString()
  @IsNotEmpty()
  label: string;
}

export class CreateDefinitionDto {
  @ApiProperty({ description: 'Display name of the custom field', example: 'Employee T-Shirt Size' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Machine-readable key (lowercase alphanumeric + underscore)',
    example: 'tshirt_size',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'fieldKey must start with a lowercase letter and contain only lowercase letters, numbers, and underscores',
  })
  fieldKey: string;

  @ApiPropertyOptional({ description: 'Description of the field', example: 'Employee preferred t-shirt size' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Entity type this field belongs to',
    enum: CustomFieldEntityType,
    example: CustomFieldEntityType.EMPLOYEE,
  })
  @IsEnum(CustomFieldEntityType)
  entityType: CustomFieldEntityType;

  @ApiProperty({
    description: 'Field data type',
    enum: CustomFieldType,
    example: CustomFieldType.SELECT,
  })
  @IsEnum(CustomFieldType)
  fieldType: CustomFieldType;

  @ApiPropertyOptional({
    description: 'Options for SELECT/MULTI_SELECT fields',
    type: [SelectOptionDto],
    example: [
      { value: 'S', label: 'Small' },
      { value: 'M', label: 'Medium' },
      { value: 'L', label: 'Large' },
    ],
  })
  @ValidateIf((o) => o.fieldType === CustomFieldType.SELECT || o.fieldType === CustomFieldType.MULTI_SELECT)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectOptionDto)
  @IsOptional()
  options?: SelectOptionDto[];

  @ApiPropertyOptional({ description: 'Whether the field is required', default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Default value for the field', example: 'M' })
  @IsOptional()
  @IsString()
  defaultValue?: string;

  @ApiPropertyOptional({ description: 'Display order (lower = shown first)', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
