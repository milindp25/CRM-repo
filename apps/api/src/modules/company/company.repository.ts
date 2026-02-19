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
