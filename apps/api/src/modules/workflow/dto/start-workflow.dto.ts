import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { WorkflowEntityType } from '@hrplatform/shared';

export class StartWorkflowDto {
  @ApiProperty({
    enum: WorkflowEntityType,
    description: 'Entity type to start workflow for',
    example: 'LEAVE',
  })
  @IsEnum(WorkflowEntityType)
  entityType: WorkflowEntityType;

  @ApiProperty({ description: 'UUID of the entity', example: 'a1b2c3d4-...' })
  @IsUUID()
  entityId: string;
}
