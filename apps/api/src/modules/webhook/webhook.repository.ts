import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WebhookRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // Webhook Endpoints
  // ============================================================================

  async createEndpoint(data: Prisma.WebhookEndpointCreateInput) {
    return this.prisma.webhookEndpoint.create({ data });
  }

  async findAllEndpoints(companyId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findEndpointById(id: string, companyId: string) {
    return this.prisma.webhookEndpoint.findFirst({
      where: { id, companyId },
    });
  }

  async updateEndpoint(
    id: string,
    companyId: string,
    data: Prisma.WebhookEndpointUpdateInput,
  ) {
    return this.prisma.webhookEndpoint.update({
      where: { id, companyId },
      data,
    });
  }

  async deleteEndpoint(id: string, companyId: string) {
    // Delete deliveries first (cascade should handle this, but be explicit)
    await this.prisma.webhookDelivery.deleteMany({
      where: { endpoint: { id, companyId } },
    });

    return this.prisma.webhookEndpoint.delete({
      where: { id, companyId },
    });
  }

  async findActiveEndpointsByEvent(companyId: string, eventType: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: {
        companyId,
        isActive: true,
        events: { has: eventType },
      },
    });
  }

  // ============================================================================
  // Webhook Deliveries
  // ============================================================================

  async createDelivery(data: Prisma.WebhookDeliveryCreateInput) {
    return this.prisma.webhookDelivery.create({ data });
  }

  async updateDelivery(id: string, data: Prisma.WebhookDeliveryUpdateInput) {
    return this.prisma.webhookDelivery.update({
      where: { id },
      data,
    });
  }

  async findDeliveries(endpointId: string, page: number = 1, limit: number = 20) {
    const where: Prisma.WebhookDeliveryWhereInput = { endpointId };

    const [data, total] = await Promise.all([
      this.prisma.webhookDelivery.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.webhookDelivery.count({ where }),
    ]);

    return { data, total };
  }

  async findDeliveryById(id: string) {
    return this.prisma.webhookDelivery.findUnique({
      where: { id },
      include: { endpoint: true },
    });
  }

  async findPendingRetries() {
    return this.prisma.webhookDelivery.findMany({
      where: {
        status: 'RETRYING',
        nextRetryAt: { lte: new Date() },
      },
      include: { endpoint: true },
    });
  }
}
