import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class EnrollDto {
  @ApiProperty({ description: 'Employee UUID to enroll' })
  @IsUUID()
  employeeId: string;
}
