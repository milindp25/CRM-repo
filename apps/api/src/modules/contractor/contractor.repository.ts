import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

export interface ContractorFilterParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface InvoiceFilterParams {
  contractorId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ContractorRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Contractor CRUD ──────────────────────────────────────────────

  async createContractor(data: Prisma.ContractorCreateInput) {
    return this.prisma.contractor.create({
      data,
    });
  }

  async findContractors(companyId: string, filter: ContractorFilterParams) {
    const { status, page = 1, limit = 20 } = filter;

    const where: Prisma.ContractorWhereInput = {
      companyId,
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.contractor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contractor.count({ where }),
    ]);

    return { data, total };
  }

  async findContractorById(id: string, companyId: string) {
    return this.prisma.contractor.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async updateContractor(
    id: string,
    companyId: string,
    data: Prisma.ContractorUpdateInput,
  ) {
    return this.prisma.contractor.update({
      where: {
        id,
        companyId,
      },
      data,
    });
  }

  async deleteContractor(id: string, companyId: string) {
    return this.prisma.contractor.update({
      where: {
        id,
        companyId,
      },
      data: {
        status: 'TERMINATED',
      },
    });
  }

  // ─── Invoice CRUD ─────────────────────────────────────────────────

  async createInvoice(data: Prisma.ContractorInvoiceCreateInput) {
    return this.prisma.contractorInvoice.create({
      data,
    });
  }

  async findInvoices(companyId: string, filter: InvoiceFilterParams) {
    const { contractorId, status, page = 1, limit = 20 } = filter;

    const where: Prisma.ContractorInvoiceWhereInput = {
      companyId,
      ...(contractorId && { contractorId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.contractorInvoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          contractor: true,
        },
      }),
      this.prisma.contractorInvoice.count({ where }),
    ]);

    return { data, total };
  }

  async findInvoiceById(id: string, companyId: string) {
    return this.prisma.contractorInvoice.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        contractor: true,
      },
    });
  }

  async updateInvoice(id: string, data: Prisma.ContractorInvoiceUpdateInput) {
    return this.prisma.contractorInvoice.update({
      where: { id },
      data,
    });
  }

  // ─── Audit Log ────────────────────────────────────────────────────

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
