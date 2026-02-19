import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomFieldRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new custom field definition.
   */
  async createDefinition(data: Prisma.CustomFieldDefinitionCreateInput) {
    return this.prisma.customFieldDefinition.create({ data });
  }

  /**
   * Find all active definitions for a company, optionally filtered by entity type.
   * Ordered by displayOrder ascending.
   */
  async findDefinitions(companyId: string, entityType?: string) {
    return this.prisma.customFieldDefinition.findMany({
      where: {
        companyId,
        isActive: true,
        ...(entityType && { entityType }),
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Find a single definition by ID within a company.
   */
  async findDefinitionById(id: string, companyId: string) {
    return this.prisma.customFieldDefinition.findFirst({
      where: {
        id,
        companyId,
        isActive: true,
      },
    });
  }

  /**
   * Find a definition by fieldKey and entityType within a company.
   */
  async findDefinitionByKey(companyId: string, entityType: string, fieldKey: string) {
    return this.prisma.customFieldDefinition.findFirst({
      where: {
        companyId,
        entityType,
        fieldKey,
        isActive: true,
      },
    });
  }

  /**
   * Update a custom field definition.
   */
  async updateDefinition(id: string, companyId: string, data: Prisma.CustomFieldDefinitionUpdateInput) {
    return this.prisma.customFieldDefinition.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete a definition by setting isActive to false.
   */
  async deleteDefinition(id: string, companyId: string) {
    return this.prisma.customFieldDefinition.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get all custom field values for an entity, including definition metadata.
   */
  async getValues(entityId: string, companyId: string) {
    return this.prisma.customFieldValue.findMany({
      where: {
        entityId,
        definition: {
          companyId,
          isActive: true,
        },
      },
      include: {
        definition: true,
      },
      orderBy: {
        definition: {
          displayOrder: 'asc',
        },
      },
    });
  }

  /**
   * Upsert a single custom field value for an entity.
   * Uses the unique constraint [definitionId, entityId].
   */
  async upsertValue(definitionId: string, entityId: string, value: string | null) {
    return this.prisma.customFieldValue.upsert({
      where: {
        definitionId_entityId: {
          definitionId,
          entityId,
        },
      },
      update: { value },
      create: {
        definitionId,
        entityId,
        value,
      },
    });
  }

  /**
   * Upsert multiple custom field values for an entity in a transaction.
   */
  async setValues(entityId: string, values: { definitionId: string; value: string | null }[]) {
    const operations = values.map(({ definitionId, value }) =>
      this.prisma.customFieldValue.upsert({
        where: {
          definitionId_entityId: {
            definitionId,
            entityId,
          },
        },
        update: { value },
        create: {
          definitionId,
          entityId,
          value,
        },
      }),
    );

    return this.prisma.$transaction(operations);
  }

  /**
   * Delete all custom field values for an entity.
   */
  async deleteValues(entityId: string) {
    return this.prisma.customFieldValue.deleteMany({
      where: { entityId },
    });
  }

  /**
   * Count active definitions for a company, optionally filtered by entity type.
   */
  async countDefinitions(companyId: string, entityType?: string) {
    return this.prisma.customFieldDefinition.count({
      where: {
        companyId,
        isActive: true,
        ...(entityType && { entityType }),
      },
    });
  }

  /**
   * Find definitions by a list of field keys for a specific company and entity type.
   */
  async findDefinitionsByKeys(companyId: string, entityType: string, fieldKeys: string[]) {
    return this.prisma.customFieldDefinition.findMany({
      where: {
        companyId,
        entityType,
        fieldKey: { in: fieldKeys },
        isActive: true,
      },
    });
  }
}
