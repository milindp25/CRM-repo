import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitSelfReviewDto {
  @ApiProperty({
    example: 4.0,
    description: 'Self-assessment rating (based on cycle rating scale)',
    minimum: 0,
    maximum: 10,
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  selfRating: number;

  @ApiPropertyOptional({
    example: 'I have successfully delivered all key projects this quarter and exceeded targets.',
    description: 'Self-assessment comments',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  selfComments?: string;
}

export class SubmitManagerReviewDto {
  @ApiProperty({
    example: 4.5,
    description: 'Manager rating for the employee (based on cycle rating scale)',
    minimum: 0,
    maximum: 10,
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  managerRating: number;

  @ApiPropertyOptional({
    example: 'Excellent performance this quarter. Consistently delivered high-quality work.',
    description: 'Manager review comments',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  managerComments?: string;

  @ApiPropertyOptional({
    example: 4.5,
    description: 'Final overall rating (if different from manager rating)',
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  finalRating?: number;

  @ApiPropertyOptional({
    example: 'Strong contributor to the team. Recommended for promotion consideration.',
    description: 'Overall comments combining self and manager assessment',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  overallComments?: string;
}
