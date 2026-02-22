import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class SalaryStructureRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.SalaryStructureCreateInput) {
    return this.prisma.salaryStructure.create({
      data,
    });
  }

  async findMany(params: {
    where?: Prisma.SalaryStructureWhereInput;
    orderBy?: Prisma.SalaryStructureOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    const { where, orderBy, skip, take } = params;

    const [data, total] = await Promise.all([
      this.prisma.salaryStructure.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      this.prisma.salaryStructure.count({ where }),
    ]);

    return { data, total };
  }

  async findById(id: string) {
    return this.prisma.salaryStructure.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.SalaryStructureUpdateInput) {
    return this.prisma.salaryStructure.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.salaryStructure.delete({
      where: { id },
    });
  }
}
