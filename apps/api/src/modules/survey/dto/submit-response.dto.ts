import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class SubmitResponseDto {
  @ApiProperty({
    description: 'Answers JSON array',
    example: [
      { questionId: 'q1', value: 4 },
      { questionId: 'q2', value: 9 },
      { questionId: 'q3', value: 'Communication' },
      { questionId: 'q4', value: 'Great team culture!' },
    ],
  })
  @IsArray()
  answers: any[];
}
