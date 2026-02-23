import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum KudosCategory {
  TEAMWORK = 'TEAMWORK',
  INNOVATION = 'INNOVATION',
  LEADERSHIP = 'LEADERSHIP',
  GOING_ABOVE = 'GOING_ABOVE',
  CUSTOMER_FOCUS = 'CUSTOMER_FOCUS',
  PROBLEM_SOLVING = 'PROBLEM_SOLVING',
  MENTORING = 'MENTORING',
  OTHER = 'OTHER',
}

export class SendKudosDto {
  @ApiProperty({ description: 'Recipient employee ID (UUID)' })
  @IsUUID()
  recipientEmployeeId: string;

  @ApiProperty({ description: 'Kudos message', example: 'Great work on the project!' })
  @IsString()
  @MaxLength(1000)
  message: string;

  @ApiProperty({ enum: KudosCategory, example: 'TEAMWORK', description: 'Kudos category' })
  @IsEnum(KudosCategory)
  category: KudosCategory;

  @ApiPropertyOptional({ description: 'Whether kudos is visible to everyone', default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
