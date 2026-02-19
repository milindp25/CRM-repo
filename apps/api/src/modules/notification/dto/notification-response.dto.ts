import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ example: 'LEAVE_APPROVED' })
  type: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  resourceType?: string | null;

  @ApiPropertyOptional()
  resourceId?: string | null;

  @ApiPropertyOptional()
  actionUrl?: string | null;

  @ApiProperty()
  isRead: boolean;

  @ApiPropertyOptional()
  readAt?: Date | null;

  @ApiProperty()
  emailSent: boolean;

  @ApiPropertyOptional()
  emailSentAt?: Date | null;

  @ApiProperty()
  createdAt: Date;
}

export class NotificationPaginationResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  data: NotificationResponseDto[];

  @ApiProperty()
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export class UnreadCountResponseDto {
  @ApiProperty()
  count: number;
}
