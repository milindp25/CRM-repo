import { Injectable } from '@nestjs/common';
import { AuditRepository, AuditFilterParams } from './audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly repository: AuditRepository) {}

  async findAll(companyId: string, params: AuditFilterParams) {
    const result = await this.repository.findMany(companyId, params);
    return {
      ...result,
      skip: params.skip ?? 0,
      take: params.take ?? 50,
    };
  }

  /**
   * Export audit logs as CSV string.
   */
  async exportCsv(companyId: string, params: Omit<AuditFilterParams, 'skip' | 'take'>): Promise<string> {
    const rows = await this.repository.findAllForExport(companyId, params);

    const headers = [
      'Date',
      'User Email',
      'Action',
      'Resource Type',
      'Resource ID',
      'Success',
      'IP Address',
      'Failure Reason',
    ];

    const csvRows = rows.map((row: any) => [
      new Date(row.createdAt).toISOString(),
      this.escapeCsvField(row.userEmail ?? ''),
      this.escapeCsvField(row.action),
      this.escapeCsvField(row.resourceType),
      row.resourceId ?? '',
      row.success ? 'Yes' : 'No',
      row.ipAddress ?? '',
      this.escapeCsvField(row.failureReason ?? ''),
    ].join(','));

    return [headers.join(','), ...csvRows].join('\n');
  }

  private escapeCsvField(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
