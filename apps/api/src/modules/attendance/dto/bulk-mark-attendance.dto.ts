import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkAttendanceRecordDto {
  @ApiProperty({ description: 'Employee UUID' })
  @IsUUID()
  employeeId: string;

  @ApiPropertyOptional({
    description: 'Attendance status',
    enum: ['PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY', 'WEEKEND', 'HOLIDAY'],
    default: 'PRESENT',
  })
  @IsOptional()
  @IsEnum(['PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY', 'WEEKEND', 'HOLIDAY'])
  status?: string;

  @ApiPropertyOptional({ description: 'Check-in time (ISO)' })
  @IsOptional()
  @IsString()
  checkInTime?: string;

  @ApiPropertyOptional({ description: 'Check-out time (ISO)' })
  @IsOptional()
  @IsString()
  checkOutTime?: string;
}

export class BulkMarkAttendanceDto {
  @ApiProperty({ description: 'Date for bulk attendance (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Array of attendance records',
    type: [BulkAttendanceRecordDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceRecordDto)
  records: BulkAttendanceRecordDto[];
}

export class BulkAttendanceResponseDto {
  @ApiProperty()
  created: number;

  @ApiProperty()
  skipped: number;

  @ApiProperty()
  errors: Array<{ employeeId: string; reason: string }>;
}
