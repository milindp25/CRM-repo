import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class AssignBillingDto {
  @ApiProperty({ description: 'Billing plan ID to assign' })
  @IsString()
  billingPlanId: string;

  @ApiPropertyOptional({ example: 'MONTHLY', description: 'Billing cycle (MONTHLY or YEARLY)' })
  @IsOptional()
  @IsString()
  billingCycle?: string;
}
