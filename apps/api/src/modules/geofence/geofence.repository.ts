import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class GeofenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createZone(data: Prisma.GeofenceZoneCreateInput) {
    return this.prisma.geofenceZone.create({
      data,
    });
  }

  async findZones(companyId: string) {
    return this.prisma.geofenceZone.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveZones(companyId: string) {
    return this.prisma.geofenceZone.findMany({
      where: {
        companyId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findZoneById(id: string, companyId: string) {
    return this.prisma.geofenceZone.findFirst({
      where: {
        id,
        companyId,
      },
    });
  }

  async updateZone(id: string, companyId: string, data: Prisma.GeofenceZoneUpdateInput) {
    return this.prisma.geofenceZone.update({
      where: {
        id,
        companyId,
      },
      data,
    });
  }

  async deleteZone(id: string, companyId: string) {
    return this.prisma.geofenceZone.update({
      where: {
        id,
        companyId,
      },
      data: {
        isActive: false,
      },
    });
  }

  async createAuditLog(data: {
    userId: string;
    companyId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    oldValues?: any;
    newValues?: any;
  }) {
    return this.prisma.auditLog.create({
      data,
    });
  }
}
