import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../../common/services/logger.service';
import { GeofenceRepository } from './geofence.repository';
import { CreateZoneDto, UpdateZoneDto } from './dto';

@Injectable()
export class GeofenceService {
  constructor(
    private readonly repository: GeofenceRepository,
    private readonly logger: LoggerService,
  ) {}

  // ─── Zone CRUD ──────────────────────────────────────────────────────

  async createZone(companyId: string, userId: string, dto: CreateZoneDto) {
    this.logger.log(`Creating geofence zone "${dto.name}" for company ${companyId}`);

    const createData: Prisma.GeofenceZoneCreateInput = {
      name: dto.name,
      latitude: new Prisma.Decimal(dto.latitude),
      longitude: new Prisma.Decimal(dto.longitude),
      radiusMeters: dto.radiusMeters,
      ...(dto.allowedIpRanges && { allowedIpRanges: dto.allowedIpRanges as any }),
      company: { connect: { id: companyId } },
    };

    const zone = await this.repository.createZone(createData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'GEOFENCE_ZONE',
      resourceId: zone.id,
      newValues: {
        name: dto.name,
        latitude: dto.latitude,
        longitude: dto.longitude,
        radiusMeters: dto.radiusMeters,
        allowedIpRanges: dto.allowedIpRanges,
      },
    });

    return zone;
  }

  async findAllZones(companyId: string) {
    this.logger.log(`Finding all geofence zones for company ${companyId}`);
    return this.repository.findZones(companyId);
  }

  async findActiveZones(companyId: string) {
    this.logger.log(`Finding active geofence zones for company ${companyId}`);
    return this.repository.findActiveZones(companyId);
  }

  async findZone(id: string, companyId: string) {
    this.logger.log(`Finding geofence zone ${id}`);

    const zone = await this.repository.findZoneById(id, companyId);

    if (!zone) {
      throw new NotFoundException('Geofence zone not found');
    }

    return zone;
  }

  async updateZone(id: string, companyId: string, userId: string, dto: UpdateZoneDto) {
    this.logger.log(`Updating geofence zone ${id}`);

    const existing = await this.repository.findZoneById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Geofence zone not found');
    }

    const updateData: Prisma.GeofenceZoneUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.latitude !== undefined && { latitude: new Prisma.Decimal(dto.latitude) }),
      ...(dto.longitude !== undefined && { longitude: new Prisma.Decimal(dto.longitude) }),
      ...(dto.radiusMeters !== undefined && { radiusMeters: dto.radiusMeters }),
      ...(dto.allowedIpRanges !== undefined && { allowedIpRanges: dto.allowedIpRanges as any }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    const updated = await this.repository.updateZone(id, companyId, updateData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'GEOFENCE_ZONE',
      resourceId: id,
      oldValues: {
        name: existing.name,
        latitude: Number(existing.latitude),
        longitude: Number(existing.longitude),
        radiusMeters: existing.radiusMeters,
      },
      newValues: dto,
    });

    return updated;
  }

  async deleteZone(id: string, companyId: string, userId: string) {
    this.logger.log(`Soft-deleting geofence zone ${id}`);

    const existing = await this.repository.findZoneById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Geofence zone not found');
    }

    const deactivated = await this.repository.deleteZone(id, companyId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'GEOFENCE_ZONE',
      resourceId: id,
      oldValues: { isActive: true },
      newValues: { isActive: false },
    });

    return deactivated;
  }

  // ─── Location Validation ────────────────────────────────────────────

  async validateLocation(
    companyId: string,
    latitude: number,
    longitude: number,
    ipAddress?: string,
  ): Promise<{ verified: boolean; zoneName?: string; distance?: number }> {
    this.logger.log(`Validating location for company ${companyId}: lat=${latitude}, lon=${longitude}`);

    const activeZones = await this.repository.findActiveZones(companyId);

    if (activeZones.length === 0) {
      // No geofence zones configured - allow by default
      return { verified: true };
    }

    for (const zone of activeZones) {
      const zoneLat = Number(zone.latitude);
      const zoneLon = Number(zone.longitude);

      const distance = this.haversineDistance(latitude, longitude, zoneLat, zoneLon);

      if (distance <= zone.radiusMeters) {
        return {
          verified: true,
          zoneName: zone.name,
          distance: Math.round(distance),
        };
      }

      // Check IP whitelist if location is outside radius but IP matches
      if (ipAddress && zone.allowedIpRanges) {
        const allowedRanges = zone.allowedIpRanges as string[];
        if (this.checkIpInRange(ipAddress, allowedRanges)) {
          return {
            verified: true,
            zoneName: zone.name,
            distance: Math.round(distance),
          };
        }
      }
    }

    // Find the closest zone for the response
    let minDistance = Infinity;
    let closestZoneName = '';

    for (const zone of activeZones) {
      const zoneLat = Number(zone.latitude);
      const zoneLon = Number(zone.longitude);
      const distance = this.haversineDistance(latitude, longitude, zoneLat, zoneLon);

      if (distance < minDistance) {
        minDistance = distance;
        closestZoneName = zone.name;
      }
    }

    return {
      verified: false,
      zoneName: closestZoneName,
      distance: Math.round(minDistance),
    };
  }

  // ─── Haversine Formula ──────────────────────────────────────────────

  /**
   * Calculate the great-circle distance between two points on Earth
   * using the Haversine formula.
   *
   * @returns Distance in meters
   */
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // ─── IP Matching ────────────────────────────────────────────────────

  /**
   * Check if an IP address matches any of the allowed ranges.
   * Currently uses exact match; CIDR support can be added later.
   */
  private checkIpInRange(ipAddress: string, allowedRanges: string[]): boolean {
    return allowedRanges.includes(ipAddress);
  }
}
