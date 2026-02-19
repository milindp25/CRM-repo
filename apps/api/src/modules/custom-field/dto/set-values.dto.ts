import { IsArray, ValidateNested, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class FieldValueDto {
  @ApiProperty({ description: 'Field key of the custom field', example: 'tshirt_size' })
  @IsString()
  @IsNotEmpty()
  fieldKey: string;

  @ApiProperty({
    description: 'Value for the field (type depends on field definition)',
    example: 'M',
  })
  value: any;
}

export class SetValuesDto {
  @ApiProperty({
    description: 'Array of field key-value pairs to set',
    type: [FieldValueDto],
    example: [
      { fieldKey: 'tshirt_size', value: 'M' },
      { fieldKey: 'blood_group', value: 'O+' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldValueDto)
  values: FieldValueDto[];
}
