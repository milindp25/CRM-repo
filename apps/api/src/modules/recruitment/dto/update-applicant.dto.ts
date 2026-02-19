import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsDateString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApplicantSource } from './create-applicant.dto';

export enum ApplicantStage {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEW = 'INTERVIEW',
  ASSESSMENT = 'ASSESSMENT',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

export class UpdateApplicantDto {
  @ApiPropertyOptional({ description: 'First name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Path to uploaded resume' })
  @IsOptional()
  @IsString()
  resumePath?: string;

  @ApiPropertyOptional({ description: 'Cover letter text' })
  @IsOptional()
  @IsString()
  coverLetter?: string;

  @ApiPropertyOptional({
    enum: ApplicantSource,
    description: 'Source of the applicant',
  })
  @IsOptional()
  @IsEnum(ApplicantSource)
  source?: ApplicantSource;

  @ApiPropertyOptional({ description: 'Rating 1-5' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Stage notes' })
  @IsOptional()
  @IsString()
  stageNotes?: string;

  @ApiPropertyOptional({ description: 'Offer salary' })
  @IsOptional()
  @IsNumber()
  offerSalary?: number;

  @ApiPropertyOptional({ description: 'Offer date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  offerDate?: string;

  @ApiPropertyOptional({ description: 'Expected join date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  joinDate?: string;
}
