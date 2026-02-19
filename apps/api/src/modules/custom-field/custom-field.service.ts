import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CustomFieldType, CustomFieldEntityType } from '@hrplatform/shared';
import { CustomFieldRepository } from './custom-field.repository';
import { CreateDefinitionDto, UpdateDefinitionDto } from './dto';

@Injectable()
export class CustomFieldService {
  constructor(private readonly repository: CustomFieldRepository) {}

  /**
   * Create a new custom field definition.
   * Validates that the field key is unique per company + entity type.
   */
  async createDefinition(companyId: string, dto: CreateDefinitionDto) {
    // Check field key uniqueness within company + entity type
    const existing = await this.repository.findDefinitionByKey(
      companyId,
      dto.entityType,
      dto.fieldKey,
    );

    if (existing) {
      throw new ConflictException(
        `A custom field with key "${dto.fieldKey}" already exists for entity type "${dto.entityType}"`,
      );
    }

    // Validate that SELECT/MULTI_SELECT fields have options
    if (
      (dto.fieldType === CustomFieldType.SELECT || dto.fieldType === CustomFieldType.MULTI_SELECT) &&
      (!dto.options || dto.options.length === 0)
    ) {
      throw new BadRequestException(
        `Options are required for ${dto.fieldType} field type`,
      );
    }

    return this.repository.createDefinition({
      name: dto.name,
      fieldKey: dto.fieldKey,
      description: dto.description ?? null,
      entityType: dto.entityType,
      fieldType: dto.fieldType,
      options: dto.options ? (dto.options as any) : undefined,
      isRequired: dto.isRequired ?? false,
      defaultValue: dto.defaultValue ?? null,
      displayOrder: dto.displayOrder ?? 0,
      company: { connect: { id: companyId } },
    });
  }

  /**
   * List all active custom field definitions for a company.
   * Optionally filtered by entity type.
   */
  async listDefinitions(companyId: string, entityType?: string) {
    return this.repository.findDefinitions(companyId, entityType);
  }

  /**
   * Get a single custom field definition by ID.
   */
  async getDefinition(id: string, companyId: string) {
    const definition = await this.repository.findDefinitionById(id, companyId);

    if (!definition) {
      throw new NotFoundException('Custom field definition not found');
    }

    return definition;
  }

  /**
   * Update a custom field definition.
   * Validates that field type changes don't break existing values if the type is changing.
   */
  async updateDefinition(id: string, companyId: string, dto: UpdateDefinitionDto) {
    const existing = await this.repository.findDefinitionById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Custom field definition not found');
    }

    // If changing fieldKey, check uniqueness
    if (dto.fieldKey && dto.fieldKey !== existing.fieldKey) {
      const duplicate = await this.repository.findDefinitionByKey(
        companyId,
        dto.entityType || existing.entityType,
        dto.fieldKey,
      );

      if (duplicate) {
        throw new ConflictException(
          `A custom field with key "${dto.fieldKey}" already exists for entity type "${dto.entityType || existing.entityType}"`,
        );
      }
    }

    // If changing to SELECT/MULTI_SELECT, validate options are provided
    const newFieldType = dto.fieldType || existing.fieldType;
    if (
      (newFieldType === CustomFieldType.SELECT || newFieldType === CustomFieldType.MULTI_SELECT) &&
      dto.fieldType && // only check when fieldType is actually being changed
      (!dto.options || dto.options.length === 0) &&
      !existing.options // and no existing options
    ) {
      throw new BadRequestException(
        `Options are required for ${newFieldType} field type`,
      );
    }

    const updateData: Record<string, any> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.fieldKey !== undefined) updateData.fieldKey = dto.fieldKey;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.entityType !== undefined) updateData.entityType = dto.entityType;
    if (dto.fieldType !== undefined) updateData.fieldType = dto.fieldType;
    if (dto.options !== undefined) updateData.options = dto.options;
    if (dto.isRequired !== undefined) updateData.isRequired = dto.isRequired;
    if (dto.defaultValue !== undefined) updateData.defaultValue = dto.defaultValue;
    if (dto.displayOrder !== undefined) updateData.displayOrder = dto.displayOrder;

    return this.repository.updateDefinition(id, companyId, updateData);
  }

  /**
   * Soft delete a custom field definition.
   */
  async deleteDefinition(id: string, companyId: string) {
    const existing = await this.repository.findDefinitionById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Custom field definition not found');
    }

    return this.repository.deleteDefinition(id, companyId);
  }

  /**
   * Get custom field values for a specific entity.
   * Returns raw values with their definition metadata.
   */
  async getEntityValues(entityId: string, companyId: string) {
    return this.repository.getValues(entityId, companyId);
  }

  /**
   * Set custom field values for a specific entity.
   * Looks up definitions by fieldKey, validates values, and upserts.
   */
  async setEntityValues(
    entityId: string,
    companyId: string,
    entityType: string,
    values: { fieldKey: string; value: any }[],
  ) {
    if (!values || values.length === 0) {
      return [];
    }

    // Extract all field keys from the input
    const fieldKeys = values.map((v) => v.fieldKey);

    // Look up all definitions in one query
    const definitions = await this.repository.findDefinitionsByKeys(
      companyId,
      entityType,
      fieldKeys,
    );

    // Create a map for quick lookup
    const definitionMap = new Map(definitions.map((d) => [d.fieldKey, d]));

    // Validate all values and build upsert data
    const upsertData: { definitionId: string; value: string | null }[] = [];

    for (const { fieldKey, value } of values) {
      const definition = definitionMap.get(fieldKey);

      if (!definition) {
        throw new BadRequestException(
          `Custom field with key "${fieldKey}" not found for entity type "${entityType}"`,
        );
      }

      // Validate and convert the value
      const convertedValue = this.validateAndConvertValue(definition, value);

      upsertData.push({
        definitionId: definition.id,
        value: convertedValue,
      });
    }

    // Upsert all values in a transaction
    await this.repository.setValues(entityId, upsertData);

    // Return the updated values with metadata
    return this.getEntityValuesFormatted(entityId, companyId);
  }

  /**
   * Get custom field values with full field metadata (name, type, options).
   * Formatted for frontend consumption.
   */
  async getEntityValuesFormatted(entityId: string, companyId: string) {
    const valuesWithDefs = await this.repository.getValues(entityId, companyId);

    return valuesWithDefs.map((v: any) => ({
      id: v.id,
      fieldKey: v.definition.fieldKey,
      name: v.definition.name,
      description: v.definition.description,
      fieldType: v.definition.fieldType,
      entityType: v.definition.entityType,
      options: v.definition.options,
      isRequired: v.definition.isRequired,
      displayOrder: v.definition.displayOrder,
      value: this.parseStoredValue(v.value, v.definition.fieldType),
      rawValue: v.value,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    }));
  }

  /**
   * Validate a value against its field definition and convert it to a storage string.
   * Returns null for null/undefined values (unless the field is required).
   */
  private validateAndConvertValue(
    definition: { fieldType: string; options: any; isRequired: boolean; fieldKey: string },
    value: any,
  ): string | null {
    // Handle null/empty values
    if (value === null || value === undefined || value === '') {
      if (definition.isRequired) {
        throw new BadRequestException(
          `Field "${definition.fieldKey}" is required`,
        );
      }
      return null;
    }

    switch (definition.fieldType) {
      case CustomFieldType.TEXT:
        return String(value);

      case CustomFieldType.NUMBER: {
        const num = Number(value);
        if (isNaN(num)) {
          throw new BadRequestException(
            `Field "${definition.fieldKey}" must be a valid number`,
          );
        }
        return String(num);
      }

      case CustomFieldType.DATE: {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new BadRequestException(
            `Field "${definition.fieldKey}" must be a valid ISO date`,
          );
        }
        return date.toISOString();
      }

      case CustomFieldType.SELECT: {
        const options = (definition.options as any[]) || [];
        const validValues = options.map((o) => o.value);
        if (!validValues.includes(String(value))) {
          throw new BadRequestException(
            `Field "${definition.fieldKey}" value must be one of: ${validValues.join(', ')}`,
          );
        }
        return String(value);
      }

      case CustomFieldType.MULTI_SELECT: {
        const options = (definition.options as any[]) || [];
        const validValues = options.map((o) => o.value);
        let selectedValues: string[];

        if (Array.isArray(value)) {
          selectedValues = value.map(String);
        } else if (typeof value === 'string') {
          try {
            selectedValues = JSON.parse(value);
            if (!Array.isArray(selectedValues)) {
              throw new Error();
            }
          } catch {
            throw new BadRequestException(
              `Field "${definition.fieldKey}" must be an array of values`,
            );
          }
        } else {
          throw new BadRequestException(
            `Field "${definition.fieldKey}" must be an array of values`,
          );
        }

        for (const v of selectedValues) {
          if (!validValues.includes(v)) {
            throw new BadRequestException(
              `Field "${definition.fieldKey}" contains invalid option "${v}". Valid options: ${validValues.join(', ')}`,
            );
          }
        }

        return JSON.stringify(selectedValues);
      }

      case CustomFieldType.BOOLEAN: {
        if (typeof value === 'boolean') {
          return String(value);
        }
        const strValue = String(value).toLowerCase();
        if (strValue !== 'true' && strValue !== 'false') {
          throw new BadRequestException(
            `Field "${definition.fieldKey}" must be true or false`,
          );
        }
        return strValue;
      }

      case CustomFieldType.URL: {
        const urlStr = String(value);
        try {
          new URL(urlStr);
        } catch {
          throw new BadRequestException(
            `Field "${definition.fieldKey}" must be a valid URL`,
          );
        }
        return urlStr;
      }

      case CustomFieldType.EMAIL: {
        const emailStr = String(value);
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailStr)) {
          throw new BadRequestException(
            `Field "${definition.fieldKey}" must be a valid email address`,
          );
        }
        return emailStr;
      }

      default:
        return String(value);
    }
  }

  /**
   * Parse a stored string value back to its appropriate type for API responses.
   */
  private parseStoredValue(value: string | null, fieldType: string): any {
    if (value === null || value === undefined) {
      return null;
    }

    switch (fieldType) {
      case CustomFieldType.NUMBER:
        return Number(value);

      case CustomFieldType.BOOLEAN:
        return value === 'true';

      case CustomFieldType.MULTI_SELECT:
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }

      case CustomFieldType.DATE:
      case CustomFieldType.TEXT:
      case CustomFieldType.SELECT:
      case CustomFieldType.URL:
      case CustomFieldType.EMAIL:
      default:
        return value;
    }
  }
}
