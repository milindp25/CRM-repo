import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class AssignAssetDto {
  @ApiProperty({ description: 'Employee UUID to assign the asset to' })
  @IsUUID()
  employeeId: string;

  @ApiPropertyOptional({ description: 'Notes about the assignment' })
  @IsOptional()
  @IsString()
  assignmentNotes?: string;
}
