import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsBoolean, IsEnum, IsUUID } from 'class-validator';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LEAVE = 'LEAVE',
  HALF_DAY = 'HALF_DAY',
  WEEKEND = 'WEEKEND',
  HOLIDAY = 'HOLIDAY',
}

export class CreateAttendanceDto {
  @ApiProperty({ description: 'Employee UUID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ example: '2024-02-12', description: 'Attendance date (YYYY-MM-DD)' })
  @IsDateString()
  attendanceDate: string;

  @ApiPropertyOptional({ example: '2024-02-12T09:00:00Z' })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiPropertyOptional({ example: '2024-02-12T18:00:00Z' })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @ApiPropertyOptional({ enum: AttendanceStatus, default: 'PRESENT' })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isWorkFromHome?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
