import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Invitation Response DTO
 * Formatted response for invitation data
 */
export class InvitationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  invitedBy: string;

  @ApiPropertyOptional({
    description: 'Inviter details',
    type: () => Object,
  })
  inviter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty()
  expiresAt: Date;

  @ApiPropertyOptional()
  acceptedAt?: Date | null;

  @ApiPropertyOptional()
  acceptedUserId?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Paginated Invitation Response
 */
export class InvitationPaginationResponseDto {
  @ApiProperty({ type: [InvitationResponseDto] })
  data: InvitationResponseDto[];

  @ApiProperty({
    example: {
      currentPage: 1,
      itemsPerPage: 20,
      totalItems: 50,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: false,
    },
  })
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Invitation Verification Response (public endpoint)
 */
export class InvitationVerifyResponseDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  valid: boolean;
}

/**
 * Accept Invitation Response
 */
export class AcceptInvitationResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty({
    type: () => Object,
  })
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}
