import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export enum ExpenseCategory {
  TRAVEL = 'TRAVEL',
  FOOD = 'FOOD',
  ACCOMMODATION = 'ACCOMMODATION',
  EQUIPMENT = 'EQUIPMENT',
  COMMUNICATION = 'COMMUNICATION',
  TRAINING = 'TRAINING',
  OTHER = 'OTHER',
}

export class CreateExpenseDto {
  @ApiProperty({ description: 'Expense title', example: 'Client meeting travel' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: 'Expense description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ExpenseCategory, example: 'TRAVEL' })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({ description: 'Expense amount', example: 1500.0 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'INR', example: 'INR' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiProperty({ description: 'Date of expense (YYYY-MM-DD)', example: '2024-03-15' })
  @IsDateString()
  expenseDate: string;

  @ApiPropertyOptional({ description: 'Employee UUID (admin can submit on behalf)' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Receipt file path' })
  @IsOptional()
  @IsString()
  receiptPath?: string;
}
