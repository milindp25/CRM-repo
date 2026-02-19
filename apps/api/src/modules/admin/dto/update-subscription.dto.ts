import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({
    example: 'PROFESSIONAL',
    description: 'Subscription tier (e.g., FREE, STARTER, PROFESSIONAL, ENTERPRISE)',
  })
  @IsOptional()
  @IsString()
  tier?: string;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    description: 'Subscription status (e.g., TRIAL, ACTIVE, SUSPENDED, CANCELLED)',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
