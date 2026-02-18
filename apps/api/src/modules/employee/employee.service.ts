import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { LoggerService } from '../../common/services/logger.service';
import { EmployeeRepository } from './employee.repository';
import { IEmployeeService } from './interfaces/employee.service.interface';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeFilterDto,
  EmployeeResponseDto,
  EmployeePaginationResponseDto,
} from './dto';
import { Prisma } from '@prisma/client';

/**
 * Employee Service (Business Logic Layer)
 * Single Responsibility: Handles employee management business logic
 * Dependency Inversion: Depends on abstractions (Repository)
 */
@Injectable()
export class EmployeeService implements IEmployeeService {
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-cbc';

  constructor(
    private readonly employeeRepository: EmployeeRepository,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    // Get encryption key from environment
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key) {
      throw new Error('ENCRYPTION_KEY is not configured');
    }
    // Use first 32 bytes of the key for AES-256
    this.encryptionKey = key.substring(0, 64);
  }

  /**
   * Create a new employee
   */
  async create(companyId: string, dto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    // Validate uniqueness
    await this.validateUniqueConstraints(companyId, dto);

    // Validate manager exists if provided
    if (dto.reportingManagerId) {
      await this.validateManager(companyId, dto.reportingManagerId);
    }

    // Encrypt sensitive fields
    const encryptedData = this.encryptSensitiveFields(dto);

    // Prepare create data with date conversions
    const createData: Prisma.EmployeeCreateInput = {
      ...encryptedData,
      dateOfJoining: new Date(dto.dateOfJoining),
      ...(dto.dateOfBirth && { dateOfBirth: new Date(dto.dateOfBirth) }),
      ...(dto.dateOfLeaving && { dateOfLeaving: new Date(dto.dateOfLeaving) }),
      ...(dto.probationEndDate && { probationEndDate: new Date(dto.probationEndDate) }),
      company: { connect: { id: companyId } },
      ...(dto.departmentId && { department: { connect: { id: dto.departmentId } } }),
      ...(dto.designationId && { designation: { connect: { id: dto.designationId } } }),
      ...(dto.reportingManagerId && { reportingManager: { connect: { id: dto.reportingManagerId } } }),
    };

    // Create employee
    const employee = await this.employeeRepository.create(createData);

    this.logger.log(`Employee created: ${employee.employeeCode} (${employee.workEmail})`, 'EmployeeService');

    // Create audit log (fire and forget)
    this.employeeRepository.createAuditLog({
      userId: companyId, // TODO: Get actual userId from context
      userEmail: 'system',
      action: 'EMPLOYEE_CREATED',
      resourceType: 'EMPLOYEE',
      resourceId: employee.id,
      companyId,
      success: true,
      metadata: { employeeCode: employee.employeeCode },
    });

    return this.mapToResponseDto(employee, false);
  }

  /**
   * Get all employees with filters and pagination
   */
  async findAll(companyId: string, filter: EmployeeFilterDto): Promise<EmployeePaginationResponseDto> {
    const { data, total } = await this.employeeRepository.findMany(companyId, filter);

    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map(emp => this.mapToResponseDto(emp, false)),
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get a single employee by ID
   */
  async findById(id: string, companyId: string, includeDecrypted: boolean = false): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepository.findById(id, companyId);

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return this.mapToResponseDto(employee, includeDecrypted);
  }

  /**
   * Update an employee
   */
  async update(id: string, companyId: string, dto: UpdateEmployeeDto): Promise<EmployeeResponseDto> {
    // Check employee exists
    const existing = await this.employeeRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    // Validate uniqueness if code or email changed
    if (dto.employeeCode && dto.employeeCode !== existing.employeeCode) {
      const codeExists = await this.employeeRepository.existsByCode(companyId, dto.employeeCode, id);
      if (codeExists) {
        throw new ConflictException(`Employee code ${dto.employeeCode} already exists`);
      }
    }

    if (dto.workEmail && dto.workEmail !== existing.workEmail) {
      const emailExists = await this.employeeRepository.existsByWorkEmail(companyId, dto.workEmail, id);
      if (emailExists) {
        throw new ConflictException(`Work email ${dto.workEmail} already exists`);
      }
    }

    // Validate manager if changed
    if (dto.reportingManagerId && dto.reportingManagerId !== existing.reportingManagerId) {
      await this.validateManager(companyId, dto.reportingManagerId, id);
    }

    // Encrypt sensitive fields if provided
    const encryptedData = this.encryptSensitiveFields(dto);

    // Prepare update data with date conversions
    const updateData: Prisma.EmployeeUpdateInput = {
      ...encryptedData,
      ...(dto.dateOfJoining && { dateOfJoining: new Date(dto.dateOfJoining) }),
      ...(dto.dateOfBirth && { dateOfBirth: new Date(dto.dateOfBirth) }),
      ...(dto.dateOfLeaving && { dateOfLeaving: new Date(dto.dateOfLeaving) }),
      ...(dto.probationEndDate && { probationEndDate: new Date(dto.probationEndDate) }),
      ...(dto.departmentId !== undefined && { department: dto.departmentId ? { connect: { id: dto.departmentId } } : { disconnect: true } }),
      ...(dto.designationId !== undefined && { designation: dto.designationId ? { connect: { id: dto.designationId } } : { disconnect: true } }),
      ...(dto.reportingManagerId !== undefined && { reportingManager: dto.reportingManagerId ? { connect: { id: dto.reportingManagerId } } : { disconnect: true } }),
    };

    // Update employee
    const employee = await this.employeeRepository.update(id, companyId, updateData);

    this.logger.log(`Employee updated: ${employee.employeeCode}`, 'EmployeeService');

    // Create audit log (fire and forget)
    this.employeeRepository.createAuditLog({
      userId: companyId,
      userEmail: 'system',
      action: 'EMPLOYEE_UPDATED',
      resourceType: 'EMPLOYEE',
      resourceId: employee.id,
      companyId,
      success: true,
      metadata: { employeeCode: employee.employeeCode },
    });

    return this.mapToResponseDto(employee, false);
  }

  /**
   * Soft delete an employee
   */
  async delete(id: string, companyId: string): Promise<void> {
    // Check employee exists
    const existing = await this.employeeRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    // Soft delete
    await this.employeeRepository.softDelete(id, companyId);

    this.logger.log(`Employee deleted: ${existing.employeeCode}`, 'EmployeeService');

    // Create audit log (fire and forget)
    this.employeeRepository.createAuditLog({
      userId: companyId,
      userEmail: 'system',
      action: 'EMPLOYEE_DELETED',
      resourceType: 'EMPLOYEE',
      resourceId: id,
      companyId,
      success: true,
      metadata: { employeeCode: existing.employeeCode },
    });
  }

  /**
   * Private: Validate unique constraints (employee code, work email)
   */
  private async validateUniqueConstraints(companyId: string, dto: CreateEmployeeDto): Promise<void> {
    const [codeExists, emailExists] = await Promise.all([
      this.employeeRepository.existsByCode(companyId, dto.employeeCode),
      this.employeeRepository.existsByWorkEmail(companyId, dto.workEmail),
    ]);

    if (codeExists) {
      throw new ConflictException(`Employee code ${dto.employeeCode} already exists`);
    }

    if (emailExists) {
      throw new ConflictException(`Work email ${dto.workEmail} already exists`);
    }
  }

  /**
   * Private: Validate manager exists and is not the same employee
   */
  private async validateManager(companyId: string, managerId: string, employeeId?: string): Promise<void> {
    // Cannot be own manager
    if (employeeId && managerId === employeeId) {
      throw new BadRequestException('Employee cannot be their own manager');
    }

    // Manager must exist in same company
    const manager = await this.employeeRepository.findById(managerId, companyId);
    if (!manager) {
      throw new BadRequestException('Reporting manager not found');
    }
  }

  /**
   * Private: Encrypt sensitive fields
   */
  private encryptSensitiveFields(data: Partial<CreateEmployeeDto | UpdateEmployeeDto>): any {
    const result: any = { ...data };

    // Remove plain text fields and add encrypted versions
    if (data.personalEmail) {
      result.personalEmailEncrypted = this.encrypt(data.personalEmail);
      delete result.personalEmail;
    }

    if (data.personalPhone) {
      result.personalPhoneEncrypted = this.encrypt(data.personalPhone);
      delete result.personalPhone;
    }

    if (data.aadhaar) {
      result.aadhaarEncrypted = this.encrypt(data.aadhaar);
      delete result.aadhaar;
    }

    if (data.pan) {
      result.panEncrypted = this.encrypt(data.pan);
      delete result.pan;
    }

    if (data.passport) {
      result.passportEncrypted = this.encrypt(data.passport);
      delete result.passport;
    }

    return result;
  }

  /**
   * Private: Encrypt string using AES-256-CBC
   */
  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const key = Buffer.from(this.encryptionKey, 'hex');
    const cipher = createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV prepended to encrypted data (separated by :)
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Private: Decrypt string using AES-256-CBC
   */
  private decrypt(encryptedText: string): string {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = Buffer.from(this.encryptionKey, 'hex');
    const decipher = createDecipheriv(this.algorithm, key, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Private: Map database entity to response DTO
   */
  private mapToResponseDto(employee: any, includeDecrypted: boolean): EmployeeResponseDto {
    const response: EmployeeResponseDto = {
      id: employee.id,
      companyId: employee.companyId,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      middleName: employee.middleName,
      lastName: employee.lastName,
      dateOfBirth: employee.dateOfBirth?.toISOString().split('T')[0],
      gender: employee.gender,
      workEmail: employee.workEmail,
      workPhone: employee.workPhone,
      addressLine1: employee.addressLine1,
      addressLine2: employee.addressLine2,
      city: employee.city,
      state: employee.state,
      country: employee.country,
      postalCode: employee.postalCode,
      dateOfJoining: employee.dateOfJoining.toISOString().split('T')[0],
      dateOfLeaving: employee.dateOfLeaving?.toISOString().split('T')[0],
      probationEndDate: employee.probationEndDate?.toISOString().split('T')[0],
      departmentId: employee.departmentId,
      designationId: employee.designationId,
      reportingManagerId: employee.reportingManagerId,
      employmentType: employee.employmentType,
      status: employee.status,
      isActive: employee.isActive,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      deletedAt: employee.deletedAt,
    };

    // Add decrypted sensitive fields for authorized roles
    if (includeDecrypted) {
      if (employee.personalEmailEncrypted) {
        response.personalEmail = this.decrypt(employee.personalEmailEncrypted);
      }
      if (employee.personalPhoneEncrypted) {
        response.personalPhone = this.decrypt(employee.personalPhoneEncrypted);
      }
      if (employee.aadhaarEncrypted) {
        response.aadhaar = this.decrypt(employee.aadhaarEncrypted);
      }
      if (employee.panEncrypted) {
        response.pan = this.decrypt(employee.panEncrypted);
      }
      if (employee.passportEncrypted) {
        response.passport = this.decrypt(employee.passportEncrypted);
      }
    }

    // Add relations if present
    if (employee.department) {
      response.department = {
        id: employee.department.id,
        name: employee.department.name,
        code: employee.department.code,
      };
    }

    if (employee.designation) {
      response.designation = {
        id: employee.designation.id,
        title: employee.designation.title,
        level: employee.designation.level,
      };
    }

    if (employee.reportingManager) {
      response.reportingManager = {
        id: employee.reportingManager.id,
        employeeCode: employee.reportingManager.employeeCode,
        firstName: employee.reportingManager.firstName,
        lastName: employee.reportingManager.lastName,
        workEmail: employee.reportingManager.workEmail,
      };
    }

    return response;
  }
}
