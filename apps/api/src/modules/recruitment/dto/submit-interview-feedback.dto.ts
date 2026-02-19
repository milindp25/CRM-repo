import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';

export enum InterviewRecommendation {
  STRONG_HIRE = 'STRONG_HIRE',
  HIRE = 'HIRE',
  NO_HIRE = 'NO_HIRE',
  STRONG_NO_HIRE = 'STRONG_NO_HIRE',
}

export class SubmitInterviewFeedbackDto {
  @ApiProperty({ description: 'Feedback text' })
  @IsString()
  feedback: string;

  @ApiPropertyOptional({ description: 'Rating 1-5' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    enum: InterviewRecommendation,
    description: 'Hiring recommendation',
  })
  @IsOptional()
  @IsEnum(InterviewRecommendation)
  recommendation?: InterviewRecommendation;
}
