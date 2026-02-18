import { PartialType } from '@nestjs/swagger';
import { CreateDepartmentDto } from './create-department.dto';

/**
 * Update Department DTO
 * All fields are optional for partial updates
 */
export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
