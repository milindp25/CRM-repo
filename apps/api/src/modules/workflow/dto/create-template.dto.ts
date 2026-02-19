import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WorkflowEntityType, WorkflowApproverType } from '@hrplatform/shared';

export class WorkflowStepConfigDto {
  @ApiProperty({ description: 'Step order (1-based)', example: 1 })
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({
    enum: WorkflowApproverType,
    description: 'Who can approve this step',
    example: 'ROLE',
  })
  @IsEnum(WorkflowApproverType)
  approverType: WorkflowApproverType;

  @ApiProperty({
    description:
      'Approver identifier: role name, user ID, or REPORTING_MANAGER',
    example: 'HR_ADMIN',
  })
  @IsString()
  approverValue: string;

  @ApiPropertyOptional({ default: true, description: 'Whether this step is required' })
  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name', example: 'Leave Approval Workflow' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: WorkflowEntityType,
    description: 'Entity type this workflow applies to',
    example: 'LEAVE',
  })
  @IsEnum(WorkflowEntityType)
  entityType: WorkflowEntityType;

  @ApiProperty({
    type: [WorkflowStepConfigDto],
    description: 'Array of step configurations',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepConfigDto)
  steps: WorkflowStepConfigDto[];
}
