import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ResolveStepDto {
  @ApiPropertyOptional({ description: 'Comments from the approver' })
  @IsOptional()
  @IsString()
  comments?: string;
}
