import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({
    example: 'PROFESSIONAL',
    description: 'Subscription tier',
  })
  @IsOptional()
  @IsString()
  tier?: string;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    description: 'Subscription status',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
