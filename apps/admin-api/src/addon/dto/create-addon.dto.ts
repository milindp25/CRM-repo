import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateAddonDto {
  @ApiProperty({ example: 'DOCUMENTS', description: 'Feature enum value' })
  @IsString()
  feature: string;

  @ApiProperty({ example: 'Document Management', description: 'Display name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the add-on' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 10.00, description: 'Monthly price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 100.00, description: 'Yearly price (discounted)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  yearlyPrice?: number;
}
