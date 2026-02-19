import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LoggerService } from '../../common/services/logger.service';
import { ExpenseRepository, ExpenseFilterParams } from './expense.repository';
import { CreateExpenseDto, UpdateExpenseDto, ApproveExpenseDto, RejectExpenseDto, ReimburseExpenseDto } from './dto';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly repository: ExpenseRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(
    companyId: string,
    userId: string,
    employeeId: string,
    dto: CreateExpenseDto,
  ) {
    const targetEmployeeId = dto.employeeId || employeeId;
    this.logger.log(`Creating expense claim for employee ${targetEmployeeId}`);

    const createData: Prisma.ExpenseClaimCreateInput = {
      title: dto.title,
      category: dto.category,
      amount: dto.amount,
      expenseDate: new Date(dto.expenseDate),
      status: 'PENDING',
      ...(dto.description && { description: dto.description }),
      ...(dto.currency && { currency: dto.currency }),
      ...(dto.receiptPath && { receiptPath: dto.receiptPath }),
      company: { connect: { id: companyId } },
      employeeId: targetEmployeeId,
    };

    const expense = await this.repository.create(createData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CREATE',
      resourceType: 'EXPENSE',
      resourceId: expense.id,
      newValues: {
        employeeId: targetEmployeeId,
        title: dto.title,
        category: dto.category,
        amount: dto.amount,
        expenseDate: dto.expenseDate,
      },
    });

    return expense;
  }

  async findAll(companyId: string, filter: ExpenseFilterParams) {
    this.logger.log('Finding all expense claims');

    const { data, total } = await this.repository.findMany(companyId, filter);

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

  async findMyExpenses(companyId: string, employeeId: string, filter: ExpenseFilterParams) {
    this.logger.log(`Finding expense claims for employee ${employeeId}`);

    const { data, total } = await this.repository.findByEmployee(
      companyId,
      employeeId,
      filter,
    );

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

  async findOne(id: string, companyId: string) {
    this.logger.log(`Finding expense claim ${id}`);

    const expense = await this.repository.findById(id, companyId);

    if (!expense) {
      throw new NotFoundException('Expense claim not found');
    }

    return expense;
  }

  async update(
    id: string,
    companyId: string,
    userId: string,
    dto: UpdateExpenseDto,
  ) {
    this.logger.log(`Updating expense claim ${id}`);

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Expense claim not found');
    }

    if (existing.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING expense claims can be updated');
    }

    const updateData: Prisma.ExpenseClaimUpdateInput = {
      ...(dto.title && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.category && { category: dto.category }),
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.currency && { currency: dto.currency }),
      ...(dto.expenseDate && { expenseDate: new Date(dto.expenseDate) }),
      ...(dto.receiptPath !== undefined && { receiptPath: dto.receiptPath }),
    };

    const updated = await this.repository.update(id, companyId, updateData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'UPDATE',
      resourceType: 'EXPENSE',
      resourceId: id,
      newValues: dto,
    });

    return updated;
  }

  async cancel(id: string, companyId: string, userId: string) {
    this.logger.log(`Cancelling expense claim ${id}`);

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Expense claim not found');
    }

    if (existing.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING expense claims can be cancelled');
    }

    const updated = await this.repository.update(id, companyId, {
      status: 'CANCELLED',
    });

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'CANCEL',
      resourceType: 'EXPENSE',
      resourceId: id,
      newValues: { status: 'CANCELLED' },
    });

    return updated;
  }

  async approve(
    id: string,
    companyId: string,
    userId: string,
    dto: ApproveExpenseDto,
  ) {
    this.logger.log(`Approving expense claim ${id}`);

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Expense claim not found');
    }

    if (existing.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING expense claims can be approved');
    }

    const updateData: Prisma.ExpenseClaimUpdateInput = {
      status: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date(),
      ...(dto.approvalNotes && { approvalNotes: dto.approvalNotes }),
    };

    const updated = await this.repository.update(id, companyId, updateData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'APPROVE',
      resourceType: 'EXPENSE',
      resourceId: id,
      newValues: { status: 'APPROVED', approvedBy: userId, approvedAt: new Date() },
    });

    return updated;
  }

  async reject(
    id: string,
    companyId: string,
    userId: string,
    dto: RejectExpenseDto,
  ) {
    this.logger.log(`Rejecting expense claim ${id}`);

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Expense claim not found');
    }

    if (existing.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING expense claims can be rejected');
    }

    const updateData: Prisma.ExpenseClaimUpdateInput = {
      status: 'REJECTED',
      approvedBy: userId,
      approvedAt: new Date(),
      ...(dto.approvalNotes && { approvalNotes: dto.approvalNotes }),
    };

    const updated = await this.repository.update(id, companyId, updateData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'REJECT',
      resourceType: 'EXPENSE',
      resourceId: id,
      newValues: { status: 'REJECTED', approvalNotes: dto.approvalNotes },
    });

    return updated;
  }

  async reimburse(
    id: string,
    companyId: string,
    userId: string,
    dto: ReimburseExpenseDto,
  ) {
    this.logger.log(`Reimbursing expense claim ${id}`);

    const existing = await this.repository.findById(id, companyId);

    if (!existing) {
      throw new NotFoundException('Expense claim not found');
    }

    if (existing.status !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED expense claims can be reimbursed');
    }

    const reimbursedAmount = dto.reimbursedAmount || Number(existing.amount);

    const updateData: Prisma.ExpenseClaimUpdateInput = {
      status: 'REIMBURSED',
      reimbursedAt: new Date(),
      reimbursedAmount: reimbursedAmount,
      ...(dto.approvalNotes && { approvalNotes: dto.approvalNotes }),
    };

    const updated = await this.repository.update(id, companyId, updateData);

    await this.repository.createAuditLog({
      userId,
      companyId,
      action: 'REIMBURSE',
      resourceType: 'EXPENSE',
      resourceId: id,
      newValues: {
        status: 'REIMBURSED',
        reimbursedAt: new Date(),
        reimbursedAmount,
      },
    });

    return updated;
  }
}
