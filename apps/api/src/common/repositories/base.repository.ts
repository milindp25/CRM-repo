import { PrismaService } from '../../database/prisma.service';

/**
 * Base repository providing common CRUD operations.
 * Reduces code duplication across 25+ repositories following DRY principle.
 *
 * Usage:
 *   @Injectable()
 *   export class EmployeeRepository extends BaseRepository<'employee'> {
 *     constructor(prisma: PrismaService) {
 *       super(prisma, 'employee');
 *     }
 *   }
 *
 * Note: This is a utility base class. Repositories that need complex queries
 * should still implement their own methods but can use these for simple ops.
 */
export abstract class BaseRepository<ModelName extends string> {
  constructor(
    protected readonly prisma: PrismaService,
    protected readonly modelName: ModelName,
  ) {}

  /**
   * Get the Prisma delegate for the model.
   * Uses dynamic access to support any model name.
   */
  protected get model(): any {
    return (this.prisma as any)[this.modelName];
  }

  async findById(id: string) {
    return this.model.findUnique({ where: { id } });
  }

  async findByIdOrThrow(id: string) {
    const record = await this.model.findUnique({ where: { id } });
    if (!record) {
      throw new Error(`${this.modelName} with ID "${id}" not found`);
    }
    return record;
  }

  async findMany(where: Record<string, unknown> = {}, options?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, string>;
    include?: Record<string, unknown>;
  }) {
    return this.model.findMany({
      where,
      ...options,
    });
  }

  async findManyWithCount(where: Record<string, unknown> = {}, options?: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, string>;
    include?: Record<string, unknown>;
  }) {
    const [data, total] = await this.prisma.$transaction([
      this.model.findMany({ where, ...options }),
      this.model.count({ where }),
    ]);
    return { data, total };
  }

  async create(data: Record<string, unknown>, include?: Record<string, unknown>) {
    return this.model.create({ data, ...(include && { include }) });
  }

  async update(id: string, data: Record<string, unknown>, include?: Record<string, unknown>) {
    return this.model.update({
      where: { id },
      data,
      ...(include && { include }),
    });
  }

  async delete(id: string) {
    return this.model.delete({ where: { id } });
  }

  async count(where: Record<string, unknown> = {}) {
    return this.model.count({ where });
  }

  async exists(where: Record<string, unknown>): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }

  /**
   * Soft-delete by setting deletedAt timestamp.
   * Only applicable for models with a deletedAt field.
   */
  async softDelete(id: string) {
    return this.model.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Create an audit log entry (utility for repos that need audit tracking).
   */
  async createAuditLog(data: {
    userId: string;
    userEmail: string;
    action: string;
    resourceType: string;
    resourceId: string;
    companyId: string;
    success: boolean;
    metadata?: unknown;
  }) {
    return this.prisma.auditLog.create({ data: data as any });
  }
}
