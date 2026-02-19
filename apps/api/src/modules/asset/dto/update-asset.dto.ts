import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { AssetCategory, AssetCondition } from './create-asset.dto';

export class UpdateAssetDto {
  @ApiPropertyOptional({ description: 'Asset name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Asset description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: AssetCategory,
    description: 'Asset category',
  })
  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;

  @ApiPropertyOptional({ description: 'Brand name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ description: 'Model name/number', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ description: 'Serial number', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  serialNumber?: string;

  @ApiPropertyOptional({ description: 'Purchase date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({ description: 'Purchase price' })
  @IsOptional()
  @IsNumber()
  purchasePrice?: number;

  @ApiPropertyOptional({ description: 'Warranty expiry date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;

  @ApiPropertyOptional({
    enum: AssetCondition,
    description: 'Asset condition',
  })
  @IsOptional()
  @IsEnum(AssetCondition)
  condition?: AssetCondition;

  @ApiPropertyOptional({ description: 'Asset location', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;
}
