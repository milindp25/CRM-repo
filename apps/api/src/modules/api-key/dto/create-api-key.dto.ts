import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsDateString,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Name for the API key', example: 'Production Integration' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Description of the API key purpose' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Array of Permission enum values to scope the API key',
    example: ['VIEW_EMPLOYEES', 'VIEW_ATTENDANCE'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  permissions: string[];

  @ApiPropertyOptional({
    description: 'Expiration date for the API key (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
