import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class AssignAddonDto {
  @ApiProperty({ description: 'Feature add-on ID to activate' })
  @IsString()
  featureAddonId: string;

  @ApiPropertyOptional({ description: 'Expiration date (optional)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
