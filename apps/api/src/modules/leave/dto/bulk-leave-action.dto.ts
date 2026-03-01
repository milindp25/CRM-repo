import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class BulkLeaveActionDto {
  @ApiProperty({ description: 'Array of leave request UUIDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  leaveIds: string[];

  @ApiPropertyOptional({ description: 'Reason/notes for the action' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkLeaveActionResponseDto {
  @ApiProperty()
  processed: number;

  @ApiProperty()
  skipped: number;

  @ApiProperty()
  errors: Array<{ leaveId: string; reason: string }>;
}
