import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RejectBatchDto {
  @ApiPropertyOptional({ description: 'Reason for rejecting the payroll batch' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RequestChangesDto {
  @ApiProperty({ description: 'Comments describing the changes needed' })
  @IsString()
  comments: string;
}
