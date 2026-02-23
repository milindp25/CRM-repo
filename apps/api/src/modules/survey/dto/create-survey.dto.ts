import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  MaxLength,
} from 'class-validator';

export enum SurveyType {
  PULSE = 'PULSE',
  ENGAGEMENT = 'ENGAGEMENT',
  EXIT = 'EXIT',
  CUSTOM = 'CUSTOM',
}

export class CreateSurveyDto {
  @ApiProperty({ description: 'Survey title', example: 'Q1 Engagement Survey' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Survey description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: SurveyType, example: 'ENGAGEMENT' })
  @IsEnum(SurveyType)
  type: SurveyType;

  @ApiPropertyOptional({ description: 'Whether responses are anonymous', default: true })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiProperty({
    description: 'Questions JSON array',
    example: [
      {
        id: 'q1',
        type: 'RATING',
        text: 'How satisfied are you with your role?',
        required: true,
      },
      {
        id: 'q2',
        type: 'NPS',
        text: 'How likely are you to recommend this company?',
        required: true,
      },
      {
        id: 'q3',
        type: 'MULTIPLE_CHOICE',
        text: 'What area needs improvement?',
        options: ['Communication', 'Leadership', 'Work-life balance', 'Compensation'],
        required: false,
      },
      {
        id: 'q4',
        type: 'TEXT',
        text: 'Any additional feedback?',
        required: false,
      },
    ],
  })
  @IsArray()
  questions: any[];

  @ApiPropertyOptional({
    description: 'Target audience filter (departments, roles, or all)',
    example: { departments: ['engineering', 'product'], all: false },
  })
  @IsOptional()
  targetAudience?: any;
}
