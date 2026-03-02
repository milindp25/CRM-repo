import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateZoneDto } from './create-zone.dto';

export class UpdateZoneDto extends PartialType(CreateZoneDto) {
  @ApiPropertyOptional({ description: 'Whether the zone is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
