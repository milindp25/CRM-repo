import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CsvService } from '../../common/services/csv.service';

/**
 * Import error detail for a single row/field
 */
export interface ImportError {
  row: number;
  field: string;
  message: string;
}

/**
 * Import result summary
 */
export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: ImportError[];
  warnings: string[];
}

/** Expected CSV headers for employee import */
const EMPLOYEE_IMPORT_HEADERS = [
  'employee_code',
  'first_name',
  'last_name',
  'work_email',
  'date_of_joining',
  'department_code',
  'designation_code',
  'employment_type',
  'gender',
  'phone',
];

/** Required fields in each employee import row */
const EMPLOYEE_REQUIRED_FIELDS = [
  'employee_code',
  'first_name',
  'last_name',
  'work_email',
  'date_of_joining',
];

/** Valid employment types */
const VALID_EMPLOYMENT_TYPES = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERN',
];

/** Valid gender values */
const VALID_GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'];

/**
 * Import/Export Service
 * Handles bulk data import from CSV and export to CSV.
 */
@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly csvService: CsvService,
  ) {}

  // =========================================================================
  // IMPORT
  // =========================================================================

  /**
   * Import employees from a CSV buffer.
   * Validates each row individually and collects all errors before returning.
   * Uses Prisma $transaction for atomic batch insert of valid rows.
   */
  async importEmployees(
    companyId: string,
    userId: string,
    buffer: Buffer,
  ): Promise<ImportResult> {
    // Parse CSV
    const rows = this.csvService.parseCSV(buffer, EMPLOYEE_IMPORT_HEADERS);

    if (rows.length === 0) {
      throw new BadRequestException('CSV file contains no data rows');
    }

    const errors: ImportError[] = [];
    const warnings: string[] = [];

    // Pre-fetch existing data for validation
    const [existingEmployees, departments, designations] = await Promise.all([
      this.prisma.employee.findMany({
        where: { companyId, deletedAt: null },
        select: { employeeCode: true, workEmail: true },
      }),
      this.prisma.department.findMany({
        where: { companyId, isActive: true, deletedAt: null },
        select: { id: true, code: true },
      }),
      this.prisma.designation.findMany({
        where: { companyId, isActive: true, deletedAt: null },
        select: { id: true, code: true },
      }),
    ]);

    // Build lookup maps
    const existingCodes = new Set(
      existingEmployees.map((e) => e.employeeCode.toLowerCase()),
    );
    const existingEmails = new Set(
      existingEmployees.map((e) => e.workEmail.toLowerCase()),
    );
    const departmentMap = new Map(
      departments.map((d) => [d.code.toLowerCase(), d.id]),
    );
    const designationMap = new Map(
      designations.map((d) => [d.code.toLowerCase(), d.id]),
    );

    // Track codes and emails within the import batch to detect duplicates
    const batchCodes = new Set<string>();
    const batchEmails = new Set<string>();

    // Validate rows and collect valid records
    const validRecords: {
      employeeCode: string;
      firstName: string;
      lastName: string;
      workEmail: string;
      dateOfJoining: Date;
      departmentId?: string;
      designationId?: string;
      employmentType: string;
      gender?: string;
      workPhone?: string;
      companyId: string;
      status: string;
      isActive: boolean;
    }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 because row 1 is header, data starts at row 2
      let rowValid = true;

      // Check required fields
      for (const field of EMPLOYEE_REQUIRED_FIELDS) {
        if (!row[field] || row[field].trim() === '') {
          errors.push({
            row: rowNum,
            field,
            message: `${field} is required`,
          });
          rowValid = false;
        }
      }

      if (!rowValid) {
        continue;
      }

      const employeeCode = row['employee_code'].trim();
      const firstName = row['first_name'].trim();
      const lastName = row['last_name'].trim();
      const workEmail = row['work_email'].trim().toLowerCase();
      const dateOfJoiningStr = row['date_of_joining'].trim();
      const departmentCode = (row['department_code'] || '').trim().toLowerCase();
      const designationCode = (row['designation_code'] || '').trim().toLowerCase();
      const employmentType = (row['employment_type'] || 'FULL_TIME').trim().toUpperCase();
      const gender = (row['gender'] || '').trim().toUpperCase();
      const phone = (row['phone'] || '').trim();

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(workEmail)) {
        errors.push({
          row: rowNum,
          field: 'work_email',
          message: `Invalid email format: ${workEmail}`,
        });
        rowValid = false;
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      let dateOfJoining: Date | null = null;
      if (!dateRegex.test(dateOfJoiningStr)) {
        errors.push({
          row: rowNum,
          field: 'date_of_joining',
          message: `Invalid date format: ${dateOfJoiningStr}. Expected YYYY-MM-DD`,
        });
        rowValid = false;
      } else {
        dateOfJoining = new Date(dateOfJoiningStr);
        if (isNaN(dateOfJoining.getTime())) {
          errors.push({
            row: rowNum,
            field: 'date_of_joining',
            message: `Invalid date value: ${dateOfJoiningStr}`,
          });
          rowValid = false;
        }
      }

      // Check employee_code uniqueness (existing DB + batch)
      if (existingCodes.has(employeeCode.toLowerCase())) {
        errors.push({
          row: rowNum,
          field: 'employee_code',
          message: `Employee code '${employeeCode}' already exists in the company`,
        });
        rowValid = false;
      } else if (batchCodes.has(employeeCode.toLowerCase())) {
        errors.push({
          row: rowNum,
          field: 'employee_code',
          message: `Duplicate employee code '${employeeCode}' within import file`,
        });
        rowValid = false;
      }

      // Check email uniqueness (existing DB + batch)
      if (existingEmails.has(workEmail)) {
        errors.push({
          row: rowNum,
          field: 'work_email',
          message: `Email '${workEmail}' already exists in the company`,
        });
        rowValid = false;
      } else if (batchEmails.has(workEmail)) {
        errors.push({
          row: rowNum,
          field: 'work_email',
          message: `Duplicate email '${workEmail}' within import file`,
        });
        rowValid = false;
      }

      // Validate employment type
      if (employmentType && !VALID_EMPLOYMENT_TYPES.includes(employmentType)) {
        errors.push({
          row: rowNum,
          field: 'employment_type',
          message: `Invalid employment type: ${employmentType}. Valid values: ${VALID_EMPLOYMENT_TYPES.join(', ')}`,
        });
        rowValid = false;
      }

      // Validate gender (optional, but validate if provided)
      if (gender && !VALID_GENDERS.includes(gender)) {
        errors.push({
          row: rowNum,
          field: 'gender',
          message: `Invalid gender: ${gender}. Valid values: ${VALID_GENDERS.join(', ')}`,
        });
        rowValid = false;
      }

      // Resolve department code to ID
      let departmentId: string | undefined;
      if (departmentCode) {
        departmentId = departmentMap.get(departmentCode);
        if (!departmentId) {
          warnings.push(
            `Row ${rowNum}: Department code '${row['department_code']}' not found, skipping department assignment`,
          );
        }
      }

      // Resolve designation code to ID
      let designationId: string | undefined;
      if (designationCode) {
        designationId = designationMap.get(designationCode);
        if (!designationId) {
          warnings.push(
            `Row ${rowNum}: Designation code '${row['designation_code']}' not found, skipping designation assignment`,
          );
        }
      }

      if (!rowValid) {
        continue;
      }

      // Track batch uniqueness
      batchCodes.add(employeeCode.toLowerCase());
      batchEmails.add(workEmail);

      validRecords.push({
        companyId,
        employeeCode,
        firstName,
        lastName,
        workEmail,
        dateOfJoining: dateOfJoining!,
        departmentId,
        designationId,
        employmentType: employmentType || 'FULL_TIME',
        gender: gender || undefined,
        workPhone: phone || undefined,
        status: 'ACTIVE',
        isActive: true,
      });
    }

    // Batch insert valid records in a transaction
    let importedCount = 0;
    if (validRecords.length > 0) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const result = await tx.employee.createMany({
            data: validRecords.map((r) => ({
              companyId: r.companyId,
              employeeCode: r.employeeCode,
              firstName: r.firstName,
              lastName: r.lastName,
              workEmail: r.workEmail,
              dateOfJoining: r.dateOfJoining,
              departmentId: r.departmentId || null,
              designationId: r.designationId || null,
              employmentType: r.employmentType,
              gender: r.gender || null,
              workPhone: r.workPhone || null,
              status: r.status,
              isActive: r.isActive,
            })),
            skipDuplicates: true,
          });
          importedCount = result.count;
        });
      } catch (error) {
        this.logger.error('Employee import transaction failed', error);
        throw new BadRequestException(
          'Import failed due to a database error. No records were imported.',
        );
      }
    }

    const skipped = rows.length - importedCount;

    this.logger.log(
      `Employee import completed for company ${companyId}: ${importedCount} imported, ${skipped} skipped, ${errors.length} errors`,
    );

    return {
      total: rows.length,
      imported: importedCount,
      skipped,
      errors,
      warnings,
    };
  }

  /**
   * Get a CSV template with headers only for a given entity type.
   */
  getImportTemplate(entityType: string): string {
    switch (entityType) {
      case 'employees':
        return EMPLOYEE_IMPORT_HEADERS.join(',') + '\r\n';
      default:
        throw new BadRequestException(
          `Unsupported entity type for import template: ${entityType}`,
        );
    }
  }

  // =========================================================================
  // EXPORT
  // =========================================================================

  /**
   * Export all active employees for a company as CSV.
   * Resolves department and designation names.
   */
  async exportEmployees(companyId: string): Promise<string> {
    const employees = await this.prisma.employee.findMany({
      where: { companyId, isActive: true, deletedAt: null },
      include: {
        department: { select: { name: true } },
        designation: { select: { title: true } },
      },
      orderBy: { employeeCode: 'asc' },
    });

    const headers = [
      { key: 'employeeCode', label: 'Employee Code' },
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'workEmail', label: 'Work Email' },
      { key: 'workPhone', label: 'Phone' },
      { key: 'dateOfJoining', label: 'Date of Joining' },
      { key: 'departmentName', label: 'Department' },
      { key: 'designationTitle', label: 'Designation' },
      { key: 'employmentType', label: 'Employment Type' },
      { key: 'status', label: 'Status' },
      { key: 'gender', label: 'Gender' },
    ];

    const data = employees.map((emp) => ({
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      workEmail: emp.workEmail,
      workPhone: emp.workPhone || '',
      dateOfJoining: this.formatDate(emp.dateOfJoining),
      departmentName: emp.department?.name || '',
      designationTitle: emp.designation?.title || '',
      employmentType: emp.employmentType,
      status: emp.status,
      gender: emp.gender || '',
    }));

    return this.csvService.generateCSV(data, headers);
  }

  /**
   * Export attendance data for a company for a specific month/year.
   * Resolves employee names and codes.
   */
  async exportAttendance(
    companyId: string,
    month: number,
    year: number,
  ): Promise<string> {
    // Build date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    const attendance = await this.prisma.attendance.findMany({
      where: {
        companyId,
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { employee: { employeeCode: 'asc' } },
        { attendanceDate: 'asc' },
      ],
    });

    const headers = [
      { key: 'employeeCode', label: 'Employee Code' },
      { key: 'employeeName', label: 'Employee Name' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
      { key: 'checkIn', label: 'Check In' },
      { key: 'checkOut', label: 'Check Out' },
      { key: 'totalHours', label: 'Total Hours' },
    ];

    const data = attendance.map((att) => ({
      employeeCode: att.employee.employeeCode,
      employeeName: `${att.employee.firstName} ${att.employee.lastName}`,
      date: this.formatDate(att.attendanceDate),
      status: att.status,
      checkIn: att.checkInTime ? this.formatDateTime(att.checkInTime) : '',
      checkOut: att.checkOutTime ? this.formatDateTime(att.checkOutTime) : '',
      totalHours: att.totalHours ? att.totalHours.toString() : '',
    }));

    return this.csvService.generateCSV(data, headers);
  }

  /**
   * Export leave data for a company with optional date range filters.
   * Resolves employee names and codes.
   */
  async exportLeaves(
    companyId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<string> {
    const where: any = { companyId };

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) {
        where.startDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.startDate.lte = new Date(endDate);
      }
    }

    const leaves = await this.prisma.leave.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { employee: { employeeCode: 'asc' } },
        { startDate: 'asc' },
      ],
    });

    const headers = [
      { key: 'employeeCode', label: 'Employee Code' },
      { key: 'employeeName', label: 'Employee Name' },
      { key: 'leaveType', label: 'Leave Type' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'endDate', label: 'End Date' },
      { key: 'totalDays', label: 'Total Days' },
      { key: 'status', label: 'Status' },
      { key: 'reason', label: 'Reason' },
    ];

    const data = leaves.map((leave) => ({
      employeeCode: leave.employee.employeeCode,
      employeeName: `${leave.employee.firstName} ${leave.employee.lastName}`,
      leaveType: leave.leaveType,
      startDate: this.formatDate(leave.startDate),
      endDate: this.formatDate(leave.endDate),
      totalDays: leave.totalDays.toString(),
      status: leave.status,
      reason: leave.reason,
    }));

    return this.csvService.generateCSV(data, headers);
  }

  /**
   * Export departments for a company as CSV.
   * Resolves head employee code if available.
   */
  async exportDepartments(companyId: string): Promise<string> {
    const departments = await this.prisma.department.findMany({
      where: { companyId, isActive: true, deletedAt: null },
      orderBy: { code: 'asc' },
    });

    // If any department has a head employee, resolve the codes
    const headEmployeeIds = departments
      .map((d) => d.headEmployeeId)
      .filter(Boolean) as string[];

    let headEmployeeMap = new Map<string, string>();
    if (headEmployeeIds.length > 0) {
      const headEmployees = await this.prisma.employee.findMany({
        where: { id: { in: headEmployeeIds } },
        select: { id: true, employeeCode: true },
      });
      headEmployeeMap = new Map(
        headEmployees.map((e) => [e.id, e.employeeCode]),
      );
    }

    const headers = [
      { key: 'code', label: 'Code' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'headEmployeeCode', label: 'Head Employee Code' },
    ];

    const data = departments.map((dept) => ({
      code: dept.code,
      name: dept.name,
      description: dept.description || '',
      headEmployeeCode: dept.headEmployeeId
        ? headEmployeeMap.get(dept.headEmployeeId) || ''
        : '',
    }));

    return this.csvService.generateCSV(data, headers);
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  /**
   * Format a Date to YYYY-MM-DD string.
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format a Date to YYYY-MM-DD HH:mm:ss string.
   */
  private formatDateTime(date: Date): string {
    const d = new Date(date);
    const datePart = this.formatDate(d);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${datePart} ${hours}:${minutes}:${seconds}`;
  }
}
