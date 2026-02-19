import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsUUID, MaxLength } from 'class-validator';
import { DocumentCategory } from '@hrplatform/shared';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Document display name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Document description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: DocumentCategory,
    description: 'Document category',
    example: DocumentCategory.CONTRACT,
  })
  @IsEnum(DocumentCategory)
  category: DocumentCategory;

  @ApiPropertyOptional({ description: 'Associated employee UUID' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;
}
