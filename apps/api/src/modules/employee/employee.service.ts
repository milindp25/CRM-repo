import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';
import { StorageService } from '../../common/services/storage.service';
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
import { PrismaService } from '../../database/prisma.service';
import { TIER_LIMITS, SubscriptionTier } from '@hrplatform/shared';
import { USER_REGISTERED } from '../../common/events/events';

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
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly storageService: StorageService,
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
  async create(companyId: string, dto: CreateEmployeeDto, userId?: string, userEmail?: string): Promise<EmployeeResponseDto> {
    // Check subscription employee limit
    await this.checkEmployeeLimit(companyId);

    // Auto-generate employee code if not provided
    if (!dto.employeeCode) {
      dto.employeeCode = await this.generateEmployeeCode(companyId);
    }

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
    this.cache.invalidateByPrefix(`emps:${companyId}`);

    this.logger.log(`Employee created: ${employee.employeeCode} (${employee.workEmail})`, 'EmployeeService');

    // Auto-create linked User account with temp password
    await this.createLinkedUserAccount(employee, companyId);

    // Create audit log (fire and forget)
    this.employeeRepository.createAuditLog({
      userId: userId || companyId,
      userEmail: userEmail || 'system',
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
    const cacheKey = `emps:${companyId}:${JSON.stringify(filter)}`;
    return this.cache.getOrSet(cacheKey, async () => {
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
    }, 30_000); // 30s cache for employee list
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
  async update(id: string, companyId: string, dto: UpdateEmployeeDto, userId?: string, userEmail?: string): Promise<EmployeeResponseDto> {
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
    this.cache.invalidateByPrefix(`emps:${companyId}`);

    this.logger.log(`Employee updated: ${employee.employeeCode}`, 'EmployeeService');

    // Create audit log (fire and forget)
    this.employeeRepository.createAuditLog({
      userId: userId || companyId,
      userEmail: userEmail || 'system',
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
  async delete(id: string, companyId: string, userId?: string, userEmail?: string): Promise<void> {
    // Check employee exists
    const existing = await this.employeeRepository.findById(id, companyId);
    if (!existing) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    // Soft delete
    await this.employeeRepository.softDelete(id, companyId);
    this.cache.invalidateByPrefix(`emps:${companyId}`);

    this.logger.log(`Employee deleted: ${existing.employeeCode}`, 'EmployeeService');

    // Create audit log (fire and forget)
    this.employeeRepository.createAuditLog({
      userId: userId || companyId,
      userEmail: userEmail || 'system',
      action: 'EMPLOYEE_DELETED',
      resourceType: 'EMPLOYEE',
      resourceId: id,
      companyId,
      success: true,
      metadata: { employeeCode: existing.employeeCode },
    });
  }

  /**
   * Upload employee photo
   */
  async uploadPhoto(id: string, companyId: string, file: Express.Multer.File) {
    const employee = await this.employeeRepository.findById(id, companyId);
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    // Delete old photo if exists
    if (employee.photoUrl) {
      try {
        await this.storageService.delete(employee.photoUrl);
      } catch {
        // Ignore deletion errors for old file
      }
    }

    const result = await this.storageService.upload(
      {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      },
      companyId,
      'photos',
    );

    // Update employee record with photo path
    await this.prisma.employee.update({
      where: { id },
      data: { photoUrl: result.filePath },
    });

    this.cache.invalidateByPrefix(`emps:${companyId}`);

    this.logger.log(`Photo uploaded for employee ${employee.employeeCode}`, 'EmployeeService');

    return { photoUrl: result.filePath };
  }

  /**
   * Private: Check if company has reached employee limit for its subscription tier
   */
  private async checkEmployeeLimit(companyId: string): Promise<void> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { subscriptionTier: true },
    });

    if (!company) return;

    const tier = company.subscriptionTier as SubscriptionTier;
    const limits = TIER_LIMITS[tier] ?? TIER_LIMITS[SubscriptionTier.FREE];

    if (limits.maxEmployees === Infinity) return;

    const currentCount = await this.prisma.employee.count({
      where: { companyId, isActive: true, deletedAt: null },
    });

    if (currentCount >= limits.maxEmployees) {
      throw new ForbiddenException(
        `Employee limit reached (${limits.maxEmployees} for ${tier} plan). Please upgrade your subscription to add more employees.`,
      );
    }
  }

  /**
   * Private: Auto-create a User account linked to the employee.
   * Generates a temporary password and emits a welcome email event.
   * Skips silently if a User with the same email already exists.
   */
  private async createLinkedUserAccount(employee: any, companyId: string): Promise<void> {
    try {
      // Check if a User already exists with this work email in this company
      const existingUser = await this.prisma.user.findFirst({
        where: { email: employee.workEmail, companyId },
      });

      if (existingUser) {
        this.logger.log(
          `User account already exists for ${employee.workEmail}, skipping auto-creation`,
          'EmployeeService',
        );
        return;
      }

      // Generate a temporary password
      const tempPassword = randomBytes(6).toString('base64url'); // ~8 chars, URL-safe

      // Hash the password
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      // Create the User record linked to this employee
      const user = await this.prisma.user.create({
        data: {
          companyId,
          email: employee.workEmail,
          passwordHash,
          firstName: employee.firstName,
          lastName: employee.lastName,
          phone: employee.workPhone ?? undefined,
          role: 'EMPLOYEE',
          employeeId: employee.id,
          isActive: true,
          emailVerified: false,
        },
      });

      // Fetch company name for the welcome email
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { companyName: true },
      });

      // Emit USER_REGISTERED event → triggers welcome email with temp password
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      this.eventEmitter.emit(USER_REGISTERED, {
        companyId,
        companyName: company?.companyName || 'Your Company',
        userId: user.id,
        userName: `${employee.firstName} ${employee.lastName}`,
        userEmail: employee.workEmail,
        loginUrl: `${frontendUrl}/login`,
        tempPassword,
      });

      this.logger.log(
        `User account auto-created for employee ${employee.employeeCode} (${employee.workEmail})`,
        'EmployeeService',
      );
    } catch (error) {
      // Don't fail employee creation if user account creation fails
      this.logger.error(
        `Failed to auto-create user account for ${employee.workEmail}: ${(error as Error).message}`,
        (error as Error).stack,
        'EmployeeService',
      );
    }
  }

  /**
   * Auto-generate a sequential employee code (EMP-001, EMP-002, etc.)
   */
  private async generateEmployeeCode(companyId: string): Promise<string> {
    const count = await this.prisma.employee.count({
      where: { companyId, deletedAt: null },
    });

    let num = count + 1;
    let code: string;
    do {
      code = `EMP-${String(num).padStart(3, '0')}`;
      num++;
    } while (await this.employeeRepository.existsByCode(companyId, code));

    return code;
  }

  /**
   * Private: Validate unique constraints (employee code, work email)
   */
  private async validateUniqueConstraints(companyId: string, dto: CreateEmployeeDto): Promise<void> {
    const employeeCode = dto.employeeCode!; // Always set by this point (auto-generated if not provided)
    const [codeExists, emailExists] = await Promise.all([
      this.employeeRepository.existsByCode(companyId, employeeCode),
      this.employeeRepository.existsByWorkEmail(companyId, dto.workEmail),
    ]);

    if (codeExists) {
      throw new ConflictException(`Employee code ${employeeCode} already exists`);
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

    // Remove relational and date fields that are handled separately in create/update
    delete result.departmentId;
    delete result.designationId;
    delete result.reportingManagerId;
    delete result.dateOfJoining;
    delete result.dateOfBirth;
    delete result.dateOfLeaving;
    delete result.probationEndDate;

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
      photoUrl: employee.photoUrl ?? undefined,
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
