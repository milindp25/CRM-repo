import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { LoggerService } from '../../common/services/logger.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly logger: LoggerService,
  ) {}

  async findAll(companyId: string) {
    this.logger.log('Fetching all users for company');
    return this.repository.findMany(companyId);
  }

  async findOne(id: string, companyId: string) {
    const user = await this.repository.findById(id);
    if (!user || user.companyId !== companyId) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateRole(id: string, companyId: string, role: string) {
    const user = await this.repository.findById(id);
    if (!user || user.companyId !== companyId) {
      throw new NotFoundException('User not found');
    }
    const allowed = ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN'];
    if (!allowed.includes(role)) {
      throw new ForbiddenException(`Invalid role: ${role}`);
    }
    this.logger.log(`Updating role for user ${id} to ${role}`);
    return this.repository.update(id, { role });
  }

  async setActive(id: string, companyId: string, isActive: boolean) {
    const user = await this.repository.findById(id);
    if (!user || user.companyId !== companyId) {
      throw new NotFoundException('User not found');
    }
    this.logger.log(`Setting user ${id} active=${isActive}`);
    return this.repository.update(id, { isActive });
  }
}
