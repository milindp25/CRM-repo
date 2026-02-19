import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  filePath: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty()
  category: string;

  @ApiPropertyOptional()
  employeeId?: string | null;

  @ApiProperty()
  uploadedBy: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  deletedAt?: Date | null;

  @ApiPropertyOptional({ type: () => Object })
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
  } | null;

  @ApiPropertyOptional({ type: () => Object })
  uploader?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

export class DocumentPaginationResponseDto {
  @ApiProperty({ type: [DocumentResponseDto] })
  data: DocumentResponseDto[];

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
