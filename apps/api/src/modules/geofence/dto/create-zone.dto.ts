import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateZoneDto {
  @ApiProperty({ description: 'Zone name', example: 'Head Office' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Latitude of zone center', example: 12.9716 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Longitude of zone center', example: 77.5946 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ description: 'Radius of zone in meters', example: 200 })
  @IsNumber()
  @Min(1)
  radiusMeters: number;

  @ApiPropertyOptional({
    description: 'Allowed IP addresses or ranges',
    example: ['192.168.1.100', '10.0.0.0/24'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedIpRanges?: string[];
}
