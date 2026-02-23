import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsBoolean,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChecklistItemDto {
  @ApiProperty({ description: 'Task title', example: 'Return company laptop' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'Role responsible for this task',
    example: 'HR_ADMIN',
  })
  @IsOptional()
  @IsString()
  assignedRole?: string;

  @ApiPropertyOptional({ description: 'Sort order', example: 1 })
  @IsOptional()
  order?: number;
}

export class CreateChecklistDto {
  @ApiProperty({
    description: 'Checklist template name',
    example: 'Standard Offboarding Checklist',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'List of checklist items',
    type: [ChecklistItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items: ChecklistItemDto[];

  @ApiPropertyOptional({
    description: 'Whether this is the default checklist',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateChecklistDto {
  @ApiPropertyOptional({ description: 'Checklist template name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'List of checklist items',
    type: [ChecklistItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items?: ChecklistItemDto[];

  @ApiPropertyOptional({
    description: 'Whether this is the default checklist',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Whether checklist is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
