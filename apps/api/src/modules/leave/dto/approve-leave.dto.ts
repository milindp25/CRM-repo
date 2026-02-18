import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveLeaveDto {
  @ApiPropertyOptional({ description: 'Notes from approver' })
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}

export class RejectLeaveDto {
  @ApiPropertyOptional({ description: 'Reason for rejection' })
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}

export class CancelLeaveDto {
  @ApiPropertyOptional({ description: 'Reason for cancellation' })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
