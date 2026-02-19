import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.company.findUnique({ where: { id } });
  }

  async update(id: string, data: {
    companyName?: string;
    email?: string;
    phone?: string;
    website?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    gstin?: string;
    pan?: string;
    cin?: string;
    industry?: string;
    employeeCount?: number;
  }) {
    return this.prisma.company.update({ where: { id }, data });
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
