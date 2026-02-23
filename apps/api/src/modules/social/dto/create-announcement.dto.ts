import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  MaxLength,
} from 'class-validator';

export enum AnnouncementPriority {
  NORMAL = 'NORMAL',
  IMPORTANT = 'IMPORTANT',
  URGENT = 'URGENT',
}

export class CreateAnnouncementDto {
  @ApiProperty({ description: 'Announcement title', example: 'Office Closure Notice' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Announcement content body' })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    enum: AnnouncementPriority,
    default: AnnouncementPriority.NORMAL,
    description: 'Priority level',
  })
  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @ApiPropertyOptional({ description: 'Pin announcement to top', default: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({
    description: 'Expiry date (ISO 8601)',
    example: '2026-03-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateAnnouncementDto {
  @ApiPropertyOptional({ description: 'Announcement title' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Announcement content body' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ enum: AnnouncementPriority, description: 'Priority level' })
  @IsOptional()
  @IsEnum(AnnouncementPriority)
  priority?: AnnouncementPriority;

  @ApiPropertyOptional({ description: 'Pin announcement to top' })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ description: 'Expiry date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
