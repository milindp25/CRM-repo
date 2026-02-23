import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class ValidateLocationDto {
  @ApiProperty({ description: 'Current latitude', example: 12.9716 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ description: 'Current longitude', example: 77.5946 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({ description: 'Client IP address', example: '192.168.1.100' })
  @IsOptional()
  @IsString()
  ipAddress?: string;
}
