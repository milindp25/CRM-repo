import { IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Supported entity types for import templates
 */
export const SUPPORTED_IMPORT_ENTITIES = ['employees'] as const;
export type ImportEntityType = (typeof SUPPORTED_IMPORT_ENTITIES)[number];

/**
 * DTO for import template download query
 */
export class ImportTemplateParamDto {
  @ApiProperty({
    description: 'Entity type for the import template',
    enum: SUPPORTED_IMPORT_ENTITIES,
    example: 'employees',
  })
  @IsString()
  @IsIn(SUPPORTED_IMPORT_ENTITIES, {
    message: `entityType must be one of: ${SUPPORTED_IMPORT_ENTITIES.join(', ')}`,
  })
  entityType: ImportEntityType;
}
