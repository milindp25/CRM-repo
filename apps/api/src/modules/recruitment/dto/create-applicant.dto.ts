import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsInt,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export enum ApplicantSource {
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  LINKEDIN = 'LINKEDIN',
  JOB_BOARD = 'JOB_BOARD',
  OTHER = 'OTHER',
}

export class CreateApplicantDto {
  @ApiProperty({ description: 'First name', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Last name', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string;

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
}
