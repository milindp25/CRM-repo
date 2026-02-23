import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class WidgetLayoutItemDto {
  @ApiProperty({ example: 'welcome', description: 'Widget identifier' })
  @IsString()
  widgetId: string;

  @ApiProperty({ example: 0, description: 'Display order (0-based)' })
  @IsInt()
  @Min(0)
  order: number;

  @ApiProperty({ example: true, description: 'Whether the widget is visible' })
  @IsBoolean()
  visible: boolean;

  @ApiProperty({ enum: ['full', 'half'], description: 'Widget size on the grid' })
  @IsEnum(['full', 'half'])
  size: 'full' | 'half';
}

export class UpdateDashboardConfigDto {
  @ApiProperty({
    type: [WidgetLayoutItemDto],
    description: 'Array of widget layout entries',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WidgetLayoutItemDto)
  layout: WidgetLayoutItemDto[];
}
