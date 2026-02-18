import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeFilterDto,
  EmployeeResponseDto,
  EmployeePaginationResponseDto,
} from '../dto';

/**
 * Employee Service Interface (for Dependency Inversion Principle)
 * Allows for different implementations and easier testing
 */
export interface IEmployeeService {
  /**
   * Create a new employee
   * @param companyId - Company UUID for multi-tenant isolation
   * @param dto - Employee data
   * @returns Created employee with relations
   */
  create(companyId: string, dto: CreateEmployeeDto): Promise<EmployeeResponseDto>;

  /**
   * Get all employees with optional filters and pagination
   * @param companyId - Company UUID for multi-tenant isolation
   * @param filter - Filter, search, sort, and pagination options
   * @returns Paginated list of employees
   */
  findAll(companyId: string, filter: EmployeeFilterDto): Promise<EmployeePaginationResponseDto>;

  /**
   * Get a single employee by ID
   * @param id - Employee UUID
   * @param companyId - Company UUID for multi-tenant isolation
   * @param includeDecrypted - Whether to decrypt sensitive fields (for authorized roles)
   * @returns Employee details with relations
   */
  findById(id: string, companyId: string, includeDecrypted?: boolean): Promise<EmployeeResponseDto>;

  /**
   * Update an employee
   * @param id - Employee UUID
   * @param companyId - Company UUID for multi-tenant isolation
   * @param dto - Updated employee data
   * @returns Updated employee with relations
   */
  update(id: string, companyId: string, dto: UpdateEmployeeDto): Promise<EmployeeResponseDto>;

  /**
   * Soft delete an employee
   * @param id - Employee UUID
   * @param companyId - Company UUID for multi-tenant isolation
   */
  delete(id: string, companyId: string): Promise<void>;
}
