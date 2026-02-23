import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum TaskStatusDto {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  BLOCKED = 'BLOCKED',
}

export class UpdateTaskDto {
  @ApiProperty({
    enum: TaskStatusDto,
    description: 'New task status',
    example: 'COMPLETED',
  })
  @IsEnum(TaskStatusDto)
  status: TaskStatusDto;

  @ApiPropertyOptional({ description: 'Notes for the task update' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ExitInterviewDto {
  @ApiProperty({ description: 'Exit interview notes or structured data' })
  @IsString()
  notes: string;
}
