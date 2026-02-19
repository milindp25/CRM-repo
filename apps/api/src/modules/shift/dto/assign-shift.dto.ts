import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  IsUUID,
  ArrayMinSize,
} from 'class-validator';

export class AssignShiftDto {
  @ApiProperty({
    description: 'Employee IDs to assign the shift to',
    type: [String],
    example: ['uuid-1', 'uuid-2'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  employeeIds: string[];

  @ApiProperty({ description: 'Assignment start date (YYYY-MM-DD)', example: '2024-03-01' })
  @IsDateString()
  assignmentDate: string;

  @ApiPropertyOptional({
    description: 'Assignment end date for recurring (YYYY-MM-DD)',
    example: '2024-03-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Notes for the assignment' })
  @IsOptional()
  @IsString()
  notes?: string;
}
