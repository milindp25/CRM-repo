import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyRepository } from './company.repository';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class CompanyService {
  constructor(
    private readonly repository: CompanyRepository,
    private readonly cache: CacheService,
  ) {}

  async getCompany(companyId: string) {
    return this.cache.getOrSet(`company:${companyId}`, async () => {
      const company = await this.repository.findById(companyId);
      if (!company) throw new NotFoundException('Company not found');
      return company;
    }, 120_000); // Company data rarely changes, cache 2 min
  }

  async updateCompany(companyId: string, data: any) {
    this.cache.invalidate(`company:${companyId}`);
    const company = await this.repository.findById(companyId);
    if (!company) throw new NotFoundException('Company not found');
    return this.repository.update(companyId, data);
  }
}
