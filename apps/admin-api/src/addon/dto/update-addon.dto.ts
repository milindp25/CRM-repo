import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class UpdateAddonDto {
  @ApiPropertyOptional({ description: 'Display name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 10.00, description: 'Monthly price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 100.00, description: 'Yearly price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  yearlyPrice?: number;

  @ApiPropertyOptional({ description: 'Whether the add-on is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
