import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class UpdateCompanyFeaturesDto {
  @ApiProperty({
    example: ['ATTENDANCE', 'LEAVE', 'PAYROLL'],
    description: 'List of feature flags to enable for the company',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  features: string[];
}
