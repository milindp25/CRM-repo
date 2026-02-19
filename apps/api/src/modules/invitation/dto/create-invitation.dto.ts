import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '@hrplatform/shared';

/**
 * Create Invitation DTO
 * Validation for sending a new invitation
 */
export class CreateInvitationDto {
  @ApiProperty({
    example: 'newuser@company.com',
    description: 'Email address to send the invitation to',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: UserRole.EMPLOYEE,
    description: 'Role to assign to the invited user',
    enum: [
      UserRole.COMPANY_ADMIN,
      UserRole.HR_ADMIN,
      UserRole.MANAGER,
      UserRole.EMPLOYEE,
    ],
  })
  @IsEnum(UserRole, {
    message: 'Role must be one of: COMPANY_ADMIN, HR_ADMIN, MANAGER, EMPLOYEE',
  })
  @IsNotEmpty()
  role: UserRole;
}
