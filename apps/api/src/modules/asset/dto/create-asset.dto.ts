import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  MaxLength,
} from 'class-validator';

export enum AssetCategory {
  LAPTOP = 'LAPTOP',
  PHONE = 'PHONE',
  MONITOR = 'MONITOR',
  DESK = 'DESK',
  CHAIR = 'CHAIR',
  VEHICLE = 'VEHICLE',
  SOFTWARE_LICENSE = 'SOFTWARE_LICENSE',
  OTHER = 'OTHER',
}

export enum AssetCondition {
  NEW = 'NEW',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  DAMAGED = 'DAMAGED',
  DISPOSED = 'DISPOSED',
}

export class CreateAssetDto {
  @ApiProperty({ description: 'Asset name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Unique asset code / identifier', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  assetCode: string;

  @ApiPropertyOptional({ description: 'Asset description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: AssetCategory,
    description: 'Asset category',
    example: AssetCategory.LAPTOP,
  })
  @IsEnum(AssetCategory)
  category: AssetCategory;

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
    default: AssetCondition.GOOD,
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
