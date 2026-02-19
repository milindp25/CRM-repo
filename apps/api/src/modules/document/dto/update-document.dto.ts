import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { DocumentCategory } from '@hrplatform/shared';

export class UpdateDocumentDto {
  @ApiPropertyOptional({ description: 'Document display name', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Document description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: DocumentCategory,
    description: 'Document category',
  })
  @IsOptional()
  @IsEnum(DocumentCategory)
  category?: DocumentCategory;
}
