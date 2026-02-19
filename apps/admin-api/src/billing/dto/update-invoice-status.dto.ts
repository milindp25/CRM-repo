import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateInvoiceStatusDto {
  @ApiProperty({ example: 'PAID', description: 'Invoice status (PENDING, PAID, OVERDUE, CANCELLED)' })
  @IsString()
  status: string;
}
