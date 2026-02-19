import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, IsOptional, Matches } from 'class-validator';

/**
 * Accept Invitation DTO
 * Validation for accepting an invitation and creating a user account
 */
export class AcceptInvitationDto {
  @ApiProperty({
    description: 'Invitation token received via email',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'John',
    description: 'First name of the new user',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the new user',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  lastName: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Password for the new account (minimum 8 characters)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Phone number (optional)',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
