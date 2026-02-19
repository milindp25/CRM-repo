import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { AssetCondition } from './create-asset.dto';

export class ReturnAssetDto {
  @ApiPropertyOptional({ description: 'Notes about the return' })
  @IsOptional()
  @IsString()
  returnNotes?: string;

  @ApiPropertyOptional({
    enum: AssetCondition,
    description: 'Condition of the asset on return',
  })
  @IsOptional()
  @IsEnum(AssetCondition)
  conditionOnReturn?: AssetCondition;
}
