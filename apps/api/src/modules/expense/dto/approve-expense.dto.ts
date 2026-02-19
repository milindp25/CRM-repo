import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

export class ApproveExpenseDto {
  @ApiPropertyOptional({ description: 'Notes from approver' })
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}

export class RejectExpenseDto {
  @ApiPropertyOptional({ description: 'Reason for rejection' })
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}

export class ReimburseExpenseDto {
  @ApiPropertyOptional({ description: 'Actual reimbursed amount (defaults to claim amount)' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  reimbursedAmount?: number;

  @ApiPropertyOptional({ description: 'Notes for reimbursement' })
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}
