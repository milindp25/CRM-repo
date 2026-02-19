import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';

export enum InterviewType {
  IN_PERSON = 'IN_PERSON',
  PHONE = 'PHONE',
  VIDEO = 'VIDEO',
}

export class ScheduleInterviewDto {
  @ApiProperty({ description: 'Scheduled date and time (ISO 8601)' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ description: 'Duration in minutes', default: 60 })
  @IsOptional()
  @IsInt()
  @Min(15)
  duration?: number;

  @ApiPropertyOptional({ description: 'Interview location or video link', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiPropertyOptional({
    enum: InterviewType,
    description: 'Interview type',
    default: InterviewType.IN_PERSON,
  })
  @IsOptional()
  @IsEnum(InterviewType)
  interviewType?: InterviewType;

  @ApiPropertyOptional({ description: 'Interview round number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  round?: number;

  @ApiPropertyOptional({ description: 'Interviewer user UUID' })
  @IsOptional()
  @IsUUID()
  interviewerId?: string;
}
