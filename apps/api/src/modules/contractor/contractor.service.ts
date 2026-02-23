import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../../common/services/logger.service';
import {
  ContractorRepository,
  ContractorFilterParams,
  InvoiceFilterParams,
} from './contractor.repository';
import { CreateContractorDto, UpdateContractorDto, CreateInvoiceDto } from './dto';

@Injectable()
export class ContractorService {
  constructor(
    private readonly repository: ContractorRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
  ) {}

  // ─── Contractor CRUD ──────────────────────────────────────────────

  async createContractor(
    companyId: string,
    userId: string,
    dto: CreateContractorDto,
  ) {
    this.logger.log(`Creating contractor ${dto.firstName} ${dto.lastName} for company ${companyId}`);

    const createData: Prisma.ContractorCreateInput = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      contractType: dto.contractType,
      startDate: new Date(dto.startDate),
      status: 'ACTIVE',
      ...(dto.phone && { phone: dto.phone }),
      ...(dto.companyName && { companyName: dto.companyName }),
      ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
      ...(dto.endDate && { endDate: new Date(dto.endDate) }),
      company: { connect: { id: companyId } },
    };

    const contractor = await this.repository.createContractor(createData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'CONTRACTOR',
      resourceId: contractor.id,
      newValues: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        contractType: dto.contractType,
      },
    });

    this.eventEmitter.emit('contractor.created', {
      companyId,
      contractorId: contractor.id,
      name: `${dto.firstName} ${dto.lastName}`,
      userId,
    });

    return contractor;
  }

  async findAllContractors(companyId: string, filter: ContractorFilterParams) {
    this.logger.log('Finding all contractors');

    const { data, total } = await this.repository.findContractors(companyId, filter);

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findContractor(id: string, companyId: string) {
    this.logger.log(`Finding contractor ${id}`);

    const contractor = await this.repository.findContractorById(id, companyId);

    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    return contractor;
  }

  async updateContractor(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateContractorDto,
  ) {
    this.logger.log(`Updating contractor ${id}`);

    const existing = await this.repository.findContractorById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Contractor not found');
    }

    const updateData: Prisma.ContractorUpdateInput = {
      ...(dto.firstName && { firstName: dto.firstName }),
      ...(dto.lastName && { lastName: dto.lastName }),
      ...(dto.email && { email: dto.email }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.companyName !== undefined && { companyName: dto.companyName }),
      ...(dto.contractType && { contractType: dto.contractType }),
      ...(dto.hourlyRate !== undefined && { hourlyRate: dto.hourlyRate }),
      ...(dto.startDate && { startDate: new Date(dto.startDate) }),
      ...(dto.endDate !== undefined && {
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      }),
    };

    const updated = await this.repository.updateContractor(id, companyId, updateData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'CONTRACTOR',
      resourceId: id,
      newValues: dto,
    });

    this.eventEmitter.emit('contractor.updated', {
      companyId,
      contractorId: id,
      userId,
    });

    return updated;
  }

  async deleteContractor(id: string, companyId: string, userId: string) {
    this.logger.log(`Terminating contractor ${id}`);

    const existing = await this.repository.findContractorById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Contractor not found');
    }

    if (existing.status === 'TERMINATED') {
      throw new BadRequestException('Contractor is already terminated');
    }

    const updated = await this.repository.deleteContractor(id, companyId);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'DELETE',
      resourceType: 'CONTRACTOR',
      resourceId: id,
      newValues: { status: 'TERMINATED' },
    });

    return updated;
  }

  // ─── Invoice Management ───────────────────────────────────────────

  async submitInvoice(
    companyId: string,
    contractorId: string,
    userId: string,
    dto: CreateInvoiceDto,
  ) {
    this.logger.log(`Submitting invoice for contractor ${contractorId}`);

    // Verify contractor exists and belongs to company
    const contractor = await this.repository.findContractorById(contractorId, companyId);

    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const createData: Prisma.ContractorInvoiceCreateInput = {
      invoiceNumber,
      amount: dto.amount,
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
      status: 'PENDING',
      ...(dto.description && { description: dto.description }),
      company: { connect: { id: companyId } },
      contractor: { connect: { id: contractorId } },
    };

    const invoice = await this.repository.createInvoice(createData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'CONTRACTOR_INVOICE',
      resourceId: invoice.id,
      newValues: {
        invoiceNumber,
        contractorId,
        amount: dto.amount,
        periodStart: dto.periodStart,
        periodEnd: dto.periodEnd,
      },
    });

    this.eventEmitter.emit('contractor.invoice.submitted', {
      companyId,
      contractorId,
      invoiceId: invoice.id,
      invoiceNumber,
      amount: dto.amount,
      userId,
    });

    return invoice;
  }

  async approveInvoice(invoiceId: string, userId: string, companyId: string) {
    this.logger.log(`Approving invoice ${invoiceId}`);

    const invoice = await this.repository.findInvoiceById(invoiceId, companyId);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING invoices can be approved');
    }

    const updated = await this.repository.updateInvoice(invoiceId, {
      status: 'APPROVED',
      approvedBy: userId,
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'APPROVE',
      resourceType: 'CONTRACTOR_INVOICE',
      resourceId: invoiceId,
      newValues: { status: 'APPROVED', approvedBy: userId },
    });

    this.eventEmitter.emit('contractor.invoice.approved', {
      companyId,
      contractorId: invoice.contractorId,
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      userId,
    });

    return updated;
  }

  async payInvoice(invoiceId: string, userId: string, companyId: string) {
    this.logger.log(`Paying invoice ${invoiceId}`);

    const invoice = await this.repository.findInvoiceById(invoiceId, companyId);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED invoices can be paid');
    }

    const updated = await this.repository.updateInvoice(invoiceId, {
      status: 'PAID',
      paidAt: new Date(),
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'PAY',
      resourceType: 'CONTRACTOR_INVOICE',
      resourceId: invoiceId,
      newValues: { status: 'PAID', paidAt: new Date() },
    });

    return updated;
  }

  async rejectInvoice(invoiceId: string, userId: string, companyId: string) {
    this.logger.log(`Rejecting invoice ${invoiceId}`);

    const invoice = await this.repository.findInvoiceById(invoiceId, companyId);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING invoices can be rejected');
    }

    const updated = await this.repository.updateInvoice(invoiceId, {
      status: 'REJECTED',
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'REJECT',
      resourceType: 'CONTRACTOR_INVOICE',
      resourceId: invoiceId,
      newValues: { status: 'REJECTED' },
    });

    return updated;
  }

  async getContractorInvoices(
    companyId: string,
    contractorId: string,
    page?: number,
    limit?: number,
  ) {
    this.logger.log(`Getting invoices for contractor ${contractorId}`);

    // Verify contractor exists
    const contractor = await this.repository.findContractorById(contractorId, companyId);

    if (!contractor) {
      throw new NotFoundException('Contractor not found');
    }

    const filterPage = page || 1;
    const filterLimit = limit || 20;

    const { data, total } = await this.repository.findInvoices(companyId, {
      contractorId,
      page: filterPage,
      limit: filterLimit,
    });

    const totalPages = Math.ceil(total / filterLimit);

    return {
      data,
      meta: {
        currentPage: filterPage,
        itemsPerPage: filterLimit,
        totalItems: total,
        totalPages,
        hasNextPage: filterPage < totalPages,
        hasPreviousPage: filterPage > 1,
      },
    };
  }

  async getInvoice(id: string, companyId: string) {
    this.logger.log(`Getting invoice ${id}`);

    const invoice = await this.repository.findInvoiceById(id, companyId);

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }
}
