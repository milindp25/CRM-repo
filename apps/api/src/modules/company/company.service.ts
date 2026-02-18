import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyRepository } from './company.repository';

@Injectable()
export class CompanyService {
  constructor(private readonly repository: CompanyRepository) {}

  async getCompany(companyId: string) {
    const company = await this.repository.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async updateCompany(companyId: string, data: any) {
    const company = await this.repository.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');
    return this.repository.update(companyId, data);
  }
}
