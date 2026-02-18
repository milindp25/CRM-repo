import { ApiProperty } from '@nestjs/swagger';
import type { UserProfile } from '@hrplatform/shared';

export class AuthResponseDto {
  @ApiProperty({ description: 'User profile information' })
  user: UserProfile;

  @ApiProperty({ description: 'JWT access token', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;
}
