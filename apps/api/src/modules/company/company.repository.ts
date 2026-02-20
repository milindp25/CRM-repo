import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.company.findUnique({ where: { id } });
  }

  async update(id: string, data: Record<string, any>) {
    // Only pick fields that exist in the Prisma Company model
    const allowedFields = [
      'companyName', 'email', 'phone', 'website',
      'addressLine1', 'addressLine2', 'city', 'state', 'country', 'postalCode',
    ];
    const filteredData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        filteredData[key] = data[key];
      }
    }
    return this.prisma.company.update({ where: { id }, data: filteredData });
  }

  async findActiveAddonFeatures(companyId: string): Promise<string[]> {
    const addons = await this.prisma.companyAddon.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        featureAddon: { isActive: true },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: { featureAddon: { select: { feature: true } } },
    });
    return addons.map(a => a.featureAddon.feature);
  }

  async updateOnboarding(id: string, step: number, completed: boolean) {
    return this.prisma.company.update({
      where: { id },
      data: {
        onboardingStep: step,
        onboardingCompleted: completed,
      },
    });
  }
}
