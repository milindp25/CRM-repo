import { Injectable } from '@nestjs/common';
import { AuditRepository } from './audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async findAll(companyId: string, params: any) {
    const result = await this.repository.findMany(companyId, params);
    return {
      ...result,
      skip: params.skip ?? 0,
      take: params.take ?? 50,
    };
  }
}
