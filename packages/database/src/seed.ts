/**
 * Database Seed Script
 * Creates test data for development
 */
import "dotenv/config"; // loads .env from current working dir
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

import * as dotenv from "dotenv";
import path from "path";

// Load env from multiple possible locations
dotenv.config({ path: path.resolve(__dirname, "../../apps/api/.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });


const prisma = new PrismaClient();

// Encryption for seed data (uses same key as the API for consistency)
function simpleEncrypt(text: string): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY env var is required. Set it in packages/database/.env or apps/api/.env');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.substring(0, 32)), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Create test company
  console.log('📦 Creating test company...');
  const company = await prisma.company.upsert({
    where: { companyCode: 'DEMO001' },
    update: {},
    create: {
      companyCode: 'DEMO001',
      companyName: 'Demo Tech Solutions Pvt Ltd',
      email: 'contact@demotech.com',
      phone: '+91-9876543210',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      postalCode: '560001',
      subscriptionTier: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
      featuresEnabled: [
        'ATTENDANCE', 'LEAVE', 'PAYROLL', 'PERFORMANCE', 'RECRUITMENT',
        'TRAINING', 'ASSETS', 'EXPENSES', 'SHIFTS', 'POLICIES',
        'CUSTOM_FIELDS', 'API_ACCESS', 'WEBHOOKS', 'AUDIT_LOGS',
        'ADVANCED_REPORTS', 'SSO', 'OFFBOARDING', 'DIRECTORY',
        'SOCIAL_FEED', 'SURVEYS', 'TIME_TRACKING', 'CONTRACTORS',
        'ANALYTICS', 'GEOFENCING', 'LEAVE_POLICIES', 'DELEGATIONS',
      ],
      payrollCountry: 'IN',
      payFrequency: 'MONTHLY',
      pfEnabled: true,
      esiEnabled: false,
    },
  });
  console.log(`✅ Company created: ${company.companyName} (${company.id})\n`);

  // 2. Create departments
  console.log('🏢 Creating departments...');
  const engineering = await prisma.department.create({
    data: {
      companyId: company.id,
      name: 'Engineering',
      code: 'ENG',
      description: 'Software development and engineering',
    },
  });

  const hr = await prisma.department.create({
    data: {
      companyId: company.id,
      name: 'Human Resources',
      code: 'HR',
      description: 'HR operations and people management',
    },
  });

  const sales = await prisma.department.create({
    data: {
      companyId: company.id,
      name: 'Sales',
      code: 'SALES',
      description: 'Sales and business development',
    },
  });
  console.log(`✅ Created ${3} departments\n`);

  // 3. Create designations
  console.log('👔 Creating designations...');
  const seniorDev = await prisma.designation.create({
    data: {
      companyId: company.id,
      title: 'Senior Software Engineer',
      code: 'SSE',
      level: 4,
      minSalary: 800000,
      maxSalary: 1500000,
      currency: 'INR',
    },
  });

  const hrManager = await prisma.designation.create({
    data: {
      companyId: company.id,
      title: 'HR Manager',
      code: 'HRM',
      level: 6,
      minSalary: 1000000,
      maxSalary: 1800000,
      currency: 'INR',
    },
  });

  const salesExec = await prisma.designation.create({
    data: {
      companyId: company.id,
      title: 'Sales Executive',
      code: 'SE',
      level: 3,
      minSalary: 400000,
      maxSalary: 800000,
      currency: 'INR',
    },
  });
  console.log(`✅ Created ${3} designations\n`);

  // 4. Create employees
  console.log('👥 Creating employees...');
  
  const emp1 = await prisma.employee.create({
    data: {
      companyId: company.id,
      employeeCode: 'EMP001',
      firstName: 'Rajesh',
      lastName: 'Kumar',
      workEmail: 'rajesh.kumar@demotech.com',
      dateOfJoining: new Date('2023-01-15'),
      departmentId: engineering.id,
      designationId: seniorDev.id,
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      // Encrypted PII (in production, use proper encryption service)
      aadhaarEncrypted: simpleEncrypt('123456789012'),
      panEncrypted: simpleEncrypt('ABCDE1234F'),
      personalEmailEncrypted: simpleEncrypt('rajesh@gmail.com'),
      personalPhoneEncrypted: simpleEncrypt('+91-9876543210'),
    },
  });

  const emp2 = await prisma.employee.create({
    data: {
      companyId: company.id,
      employeeCode: 'EMP002',
      firstName: 'Priya',
      lastName: 'Sharma',
      workEmail: 'priya.sharma@demotech.com',
      dateOfJoining: new Date('2023-03-01'),
      departmentId: hr.id,
      designationId: hrManager.id,
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      aadhaarEncrypted: simpleEncrypt('987654321098'),
      panEncrypted: simpleEncrypt('XYZAB5678C'),
      personalEmailEncrypted: simpleEncrypt('priya@gmail.com'),
      personalPhoneEncrypted: simpleEncrypt('+91-9876543211'),
    },
  });

  const emp3 = await prisma.employee.create({
    data: {
      companyId: company.id,
      employeeCode: 'EMP003',
      firstName: 'Amit',
      lastName: 'Patel',
      workEmail: 'amit.patel@demotech.com',
      dateOfJoining: new Date('2023-06-15'),
      departmentId: sales.id,
      designationId: salesExec.id,
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      reportingManagerId: emp1.id,
      aadhaarEncrypted: simpleEncrypt('456789123456'),
      panEncrypted: simpleEncrypt('PQRST9012D'),
      personalEmailEncrypted: simpleEncrypt('amit@gmail.com'),
      personalPhoneEncrypted: simpleEncrypt('+91-9876543212'),
    },
  });
  console.log(`✅ Created ${3} employees\n`);

  // 5. Create users with different roles
  console.log('🔐 Creating users...');
  const userPassword = process.env.SEED_USER_PASSWORD;
  if (!userPassword) throw new Error('SEED_USER_PASSWORD env var is required. Set it in packages/database/.env');
  const passwordHash = await bcrypt.hash(userPassword, 12);

  const adminUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'admin@demotech.com',
      passwordHash: passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'COMPANY_ADMIN',
      permissions: ['ALL'],
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`  COMPANY_ADMIN: ${adminUser.email}`);

  const hrUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'hr@demotech.com',
      passwordHash: passwordHash,
      firstName: 'Priya',
      lastName: 'Sharma',
      role: 'HR_ADMIN',
      permissions: ['MANAGE_EMPLOYEES', 'VIEW_EMPLOYEES', 'MANAGE_ATTENDANCE', 'VIEW_ATTENDANCE', 'MANAGE_LEAVES', 'VIEW_LEAVES', 'MANAGE_PAYROLL', 'VIEW_PAYROLL', 'VIEW_USERS', 'CREATE_USERS', 'UPDATE_USERS', 'VIEW_REPORTS', 'VIEW_DEPARTMENTS', 'MANAGE_DEPARTMENTS', 'VIEW_DESIGNATIONS', 'MANAGE_DESIGNATIONS', 'VIEW_PERFORMANCE', 'MANAGE_PERFORMANCE', 'VIEW_RECRUITMENT', 'MANAGE_RECRUITMENT', 'VIEW_TRAINING', 'MANAGE_TRAINING', 'VIEW_ASSETS', 'MANAGE_ASSETS', 'VIEW_EXPENSES', 'MANAGE_EXPENSES', 'VIEW_SHIFTS', 'MANAGE_SHIFTS', 'VIEW_POLICIES', 'MANAGE_POLICIES', 'MANAGE_LEAVE_POLICIES', 'MANAGE_OFFBOARDING', 'VIEW_DIRECTORY', 'MANAGE_SURVEYS', 'VIEW_TIMESHEETS', 'VIEW_ANALYTICS', 'MANAGE_DASHBOARD_CONFIG'],
      employeeId: emp2.id,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`  HR_ADMIN: ${hrUser.email}`);

  const mgrUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'manager@demotech.com',
      passwordHash: passwordHash,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      role: 'MANAGER',
      permissions: ['VIEW_EMPLOYEES', 'VIEW_ATTENDANCE', 'MARK_ATTENDANCE', 'APPLY_LEAVE', 'APPROVE_LEAVE', 'VIEW_LEAVES', 'VIEW_PAYROLL', 'VIEW_OWN_PAYROLL', 'VIEW_DEPARTMENTS', 'VIEW_DESIGNATIONS', 'VIEW_PERFORMANCE', 'VIEW_OWN_PERFORMANCE', 'VIEW_TRAINING', 'ENROLL_TRAINING', 'SUBMIT_EXPENSE', 'APPROVE_EXPENSE', 'VIEW_SHIFTS', 'APPROVE_TIMESHEETS', 'VIEW_OWN_TIMESHEETS', 'SEND_KUDOS', 'VIEW_DIRECTORY', 'RESPOND_SURVEY', 'MANAGE_DASHBOARD_CONFIG', 'VIEW_USERS'],
      employeeId: emp1.id,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`  MANAGER: ${mgrUser.email}`);

  const empUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'employee@demotech.com',
      passwordHash: passwordHash,
      firstName: 'Amit',
      lastName: 'Patel',
      role: 'EMPLOYEE',
      permissions: ['VIEW_EMPLOYEES', 'VIEW_ATTENDANCE', 'MARK_ATTENDANCE', 'APPLY_LEAVE', 'VIEW_LEAVES', 'VIEW_OWN_PAYROLL', 'VIEW_OWN_PERFORMANCE', 'SUBMIT_SELF_REVIEW', 'ENROLL_TRAINING', 'VIEW_TRAINING', 'SUBMIT_EXPENSE', 'VIEW_OWN_TIMESHEETS', 'SEND_KUDOS', 'VIEW_DIRECTORY', 'RESPOND_SURVEY', 'ACKNOWLEDGE_POLICY'],
      employeeId: emp3.id,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`  EMPLOYEE: ${empUser.email}`);
  console.log(`✅ Created 4 users for DemoTech\n`);

  // 6. Create sample attendance records (last 7 days)
  console.log('📅 Creating attendance records...');
  const today = new Date();
  let attendanceCount = 0;

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const emp of [emp1, emp2, emp3]) {
      await prisma.attendance.create({
        data: {
          companyId: company.id,
          employeeId: emp.id,
          attendanceDate: date,
          checkInTime: new Date(date.setHours(9, Math.floor(Math.random() * 30), 0)),
          checkOutTime: new Date(date.setHours(18, Math.floor(Math.random() * 30), 0)),
          totalHours: 8.5 + (Math.random() * 0.5),
          status: 'PRESENT',
          isWorkFromHome: Math.random() > 0.7, // 30% WFH
        },
      });
      attendanceCount++;
    }
  }
  console.log(`✅ Created ${attendanceCount} attendance records\n`);

  // 7. Create sample leave applications
  console.log('🏖️ Creating leave applications...');
  await prisma.leave.create({
    data: {
      companyId: company.id,
      employeeId: emp1.id,
      leaveType: 'CASUAL',
      startDate: new Date('2025-02-20'),
      endDate: new Date('2025-02-21'),
      totalDays: 2,
      reason: 'Personal work',
      status: 'APPROVED',
      approvedBy: adminUser.id,
      approvedAt: new Date(),
    },
  });

  await prisma.leave.create({
    data: {
      companyId: company.id,
      employeeId: emp3.id,
      leaveType: 'SICK',
      startDate: new Date('2025-02-15'),
      endDate: new Date('2025-02-15'),
      totalDays: 1,
      reason: 'Feeling unwell',
      status: 'PENDING',
    },
  });
  console.log(`✅ Created ${2} leave applications\n`);

  // 8. Seed Tax Configurations (day-0 rates for India & US)
  console.log('📊 Seeding tax configurations...');
  const taxConfigs = [
    {
      country: 'IN',
      configKey: 'IN_NEW_REGIME_BRACKETS',
      configValue: {
        fiscalYear: 2025,
        standardDeduction: 75000,
        slabs: [
          { min: 0, max: 400000, rate: 0 },
          { min: 400000, max: 800000, rate: 5 },
          { min: 800000, max: 1200000, rate: 10 },
          { min: 1200000, max: 1600000, rate: 15 },
          { min: 1600000, max: 2000000, rate: 20 },
          { min: 2000000, max: 2400000, rate: 25 },
          { min: 2400000, max: null, rate: 30 },
        ],
        rebate87A: { maxIncome: 1200000, maxRebate: 60000 },
        cess: 4,
      },
      fiscalYear: 2025,
      effectiveFrom: new Date('2025-04-01'),
      effectiveTo: new Date('2026-03-31'),
    },
    {
      country: 'IN',
      configKey: 'IN_OLD_REGIME_BRACKETS',
      configValue: {
        fiscalYear: 2025,
        standardDeduction: 50000,
        slabs: [
          { min: 0, max: 250000, rate: 0 },
          { min: 250000, max: 500000, rate: 5 },
          { min: 500000, max: 1000000, rate: 20 },
          { min: 1000000, max: null, rate: 30 },
        ],
        rebate87A: { maxIncome: 500000, maxRebate: 12500 },
        cess: 4,
      },
      fiscalYear: 2025,
      effectiveFrom: new Date('2025-04-01'),
      effectiveTo: new Date('2026-03-31'),
    },
    {
      country: 'IN',
      configKey: 'IN_PF_CONFIG',
      configValue: { employeeRate: 12, employerEpfRate: 3.67, employerEpsRate: 8.33, ceilingMonthly: 15000 },
      fiscalYear: 2025,
      effectiveFrom: new Date('2025-04-01'),
      effectiveTo: new Date('2026-03-31'),
    },
    {
      country: 'IN',
      configKey: 'IN_ESI_CONFIG',
      configValue: { employeeRate: 0.75, employerRate: 3.25, grossCeilingMonthly: 21000 },
      fiscalYear: 2025,
      effectiveFrom: new Date('2025-04-01'),
      effectiveTo: new Date('2026-03-31'),
    },
    {
      country: 'IN',
      configKey: 'IN_PROFESSIONAL_TAX',
      configValue: {
        Karnataka: [{ minMonthly: 0, maxMonthly: 15000, tax: 0 }, { minMonthly: 15001, maxMonthly: null, tax: 200 }],
        Maharashtra: [{ minMonthly: 0, maxMonthly: 7500, tax: 0 }, { minMonthly: 7501, maxMonthly: 10000, tax: 175 }, { minMonthly: 10001, maxMonthly: null, tax: 200 }],
        'Tamil Nadu': [{ minMonthly: 0, maxMonthly: 21000, tax: 0 }, { minMonthly: 21001, maxMonthly: 30000, tax: 135 }, { minMonthly: 30001, maxMonthly: 45000, tax: 315 }, { minMonthly: 45001, maxMonthly: 60000, tax: 690 }, { minMonthly: 60001, maxMonthly: 75000, tax: 1025 }, { minMonthly: 75001, maxMonthly: null, tax: 1250 }],
        Telangana: [{ minMonthly: 0, maxMonthly: 15000, tax: 0 }, { minMonthly: 15001, maxMonthly: 20000, tax: 150 }, { minMonthly: 20001, maxMonthly: null, tax: 200 }],
      },
      fiscalYear: 2025,
      effectiveFrom: new Date('2025-04-01'),
      effectiveTo: new Date('2026-03-31'),
    },
    {
      country: 'US',
      configKey: 'US_FICA_CONFIG',
      configValue: {
        socialSecurity: { employeeRate: 6.2, employerRate: 6.2, wageCap: 176100 },
        medicare: { employeeRate: 1.45, employerRate: 1.45, additionalMedicareRate: 0.9, additionalMedicareThreshold: 200000 },
      },
      fiscalYear: 2025,
      effectiveFrom: new Date('2025-01-01'),
      effectiveTo: new Date('2025-12-31'),
    },
    {
      country: 'US',
      configKey: 'US_FEDERAL_TAX',
      configValue: {
        standardDeduction: { SINGLE: 15750, MARRIED_FILING_JOINTLY: 31500, MARRIED_FILING_SEPARATELY: 15750, HEAD_OF_HOUSEHOLD: 23625 },
        brackets: {
          SINGLE: [
            { min: 0, max: 11925, rate: 10 }, { min: 11925, max: 48475, rate: 12 },
            { min: 48475, max: 103350, rate: 22 }, { min: 103350, max: 197300, rate: 24 },
            { min: 197300, max: 250525, rate: 32 }, { min: 250525, max: 626350, rate: 35 },
            { min: 626350, max: null, rate: 37 },
          ],
          MARRIED_FILING_JOINTLY: [
            { min: 0, max: 23850, rate: 10 }, { min: 23850, max: 96950, rate: 12 },
            { min: 96950, max: 206700, rate: 22 }, { min: 206700, max: 394600, rate: 24 },
            { min: 394600, max: 501050, rate: 32 }, { min: 501050, max: 751600, rate: 35 },
            { min: 751600, max: null, rate: 37 },
          ],
        },
      },
      fiscalYear: 2025,
      effectiveFrom: new Date('2025-01-01'),
      effectiveTo: new Date('2025-12-31'),
    },
    {
      country: 'US',
      configKey: 'US_STATE_TAX',
      configValue: {
        TX: { type: 'none' }, FL: { type: 'none' }, WA: { type: 'none' }, NV: { type: 'none' },
        IL: { type: 'flat', rate: 4.95 }, PA: { type: 'flat', rate: 3.07 }, CO: { type: 'flat', rate: 4.4 },
        CA: { type: 'bracket', brackets: [
          { min: 0, max: 10412, rate: 1 }, { min: 10412, max: 24684, rate: 2 },
          { min: 24684, max: 38959, rate: 4 }, { min: 38959, max: 54081, rate: 6 },
          { min: 54081, max: 68350, rate: 8 }, { min: 68350, max: 349137, rate: 9.3 },
          { min: 349137, max: null, rate: 12.3 },
        ]},
        NY: { type: 'bracket', brackets: [
          { min: 0, max: 8500, rate: 4 }, { min: 8500, max: 11700, rate: 4.5 },
          { min: 11700, max: 80650, rate: 5.5 }, { min: 80650, max: 215400, rate: 6 },
          { min: 215400, max: 1077550, rate: 6.85 }, { min: 1077550, max: null, rate: 10.9 },
        ]},
      },
      fiscalYear: 2025,
      effectiveFrom: new Date('2025-01-01'),
      effectiveTo: new Date('2025-12-31'),
    },
  ];

  let taxConfigCount = 0;
  for (const config of taxConfigs) {
    await prisma.taxConfiguration.upsert({
      where: {
        country_configKey_fiscalYear: {
          country: config.country,
          configKey: config.configKey,
          fiscalYear: config.fiscalYear,
        },
      },
      update: { configValue: config.configValue as any, effectiveFrom: config.effectiveFrom, effectiveTo: config.effectiveTo, isActive: true },
      create: { ...config, configValue: config.configValue as any, isActive: true },
    });
    taxConfigCount++;
  }
  console.log(`✅ Seeded ${taxConfigCount} tax configurations (India FY 2025-26 + US 2025)\n`);

  // 9. Create default salary structure for the company
  console.log('💼 Creating salary structure...');
  const seedStructureId = '00000000-0000-4000-a000-000000000001';
  const salaryStructure = await prisma.salaryStructure.upsert({
    where: { id: seedStructureId },
    update: {},
    create: {
      id: seedStructureId,
      companyId: company.id,
      name: 'Standard CTC Structure (India)',
      description: 'Default salary breakup: 50% Basic, 20% HRA, 10% Special Allowance, 20% Other',
      country: 'IN',
      components: [
        { name: 'Basic Salary', type: 'EARNING', calculationType: 'PERCENTAGE_OF_GROSS', value: 50, isTaxable: true },
        { name: 'HRA', type: 'EARNING', calculationType: 'PERCENTAGE_OF_BASIC', value: 40, isTaxable: true },
        { name: 'Special Allowance', type: 'EARNING', calculationType: 'PERCENTAGE_OF_GROSS', value: 10, isTaxable: true },
        { name: 'Other Allowances', type: 'EARNING', calculationType: 'PERCENTAGE_OF_GROSS', value: 20, isTaxable: false },
      ] as any,
      isActive: true,
    },
  });
  console.log(`✅ Salary structure created: ${salaryStructure.name}\n`);

  // Update employees with salary structure and annual CTC
  await prisma.employee.update({
    where: { id: emp1.id },
    data: { salaryStructureId: salaryStructure.id, annualCtc: 1200000 },
  });
  await prisma.employee.update({
    where: { id: emp2.id },
    data: { salaryStructureId: salaryStructure.id, annualCtc: 1000000 },
  });
  await prisma.employee.update({
    where: { id: emp3.id },
    data: { salaryStructureId: salaryStructure.id, annualCtc: 600000 },
  });
  console.log(`✅ Linked 3 employees to salary structure with annual CTC\n`);

  // 10. Create sample payroll record
  console.log('💰 Creating payroll records...');
  await prisma.payroll.create({
    data: {
      companyId: company.id,
      employeeId: emp1.id,
      payPeriodMonth: 1,
      payPeriodYear: 2025,
      basicSalaryEncrypted: simpleEncrypt('50000'),
      hraEncrypted: simpleEncrypt('20000'),
      grossSalaryEncrypted: simpleEncrypt('80000'),
      netSalaryEncrypted: simpleEncrypt('71200'),
      pfEmployee: 6000,
      pfEmployer: 6000,
      tds: 2800,
      daysWorked: 22,
      daysInMonth: 22,
      status: 'PAID',
      paidAt: new Date('2025-02-01'),
    },
  });
  console.log(`✅ Created ${1} payroll record\n`);

  // 9. Create audit log
  console.log('📋 Creating audit log entry...');
  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      userId: adminUser.id,
      userEmail: adminUser.email,
      action: 'CREATE',
      resourceType: 'EMPLOYEE',
      resourceId: emp1.id,
      newValues: { employeeCode: emp1.employeeCode, name: `${emp1.firstName} ${emp1.lastName}` },
      ipAddress: '192.168.1.1',
      success: true,
    },
  });
  console.log(`✅ Created audit log\n`);

  // 11. Create SUPER_ADMIN user (for admin portal)
  console.log('🔑 Creating super admin user...');
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) throw new Error('SEED_ADMIN_PASSWORD env var is required. Set it in packages/database/.env');
  const superAdminHash = await bcrypt.hash(adminPassword, 12);
  const superAdmin = await prisma.user.upsert({
    where: { companyId_email: { companyId: company.id, email: 'superadmin@hrplatform.com' } },
    update: {},
    create: {
      companyId: company.id,
      email: 'superadmin@hrplatform.com',
      passwordHash: superAdminHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      permissions: ['ALL'],
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ Super admin created: ${superAdmin.email}\n`);

  // 12. Create second company (FREE tier) for feature gating testing
  console.log('📦 Creating second company (FREE tier)...');
  const startupCo = await prisma.company.upsert({
    where: { companyCode: 'STARTUP001' },
    update: {},
    create: {
      companyCode: 'STARTUP001',
      companyName: 'StartupCo',
      email: 'contact@startupco.com',
      phone: '+91-9999999999',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400001',
      subscriptionTier: 'FREE',
      subscriptionStatus: 'ACTIVE',
      featuresEnabled: [],
    },
  });
  console.log(`✅ Company created: ${startupCo.companyName} (${startupCo.id})`);

  const startupAdminHash = await bcrypt.hash(userPassword, 12);
  const startupAdmin = await prisma.user.create({
    data: {
      companyId: startupCo.id,
      email: 'admin@startupco.com',
      passwordHash: startupAdminHash,
      firstName: 'Startup',
      lastName: 'Admin',
      role: 'COMPANY_ADMIN',
      permissions: ['ALL'],
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ StartupCo admin created: ${startupAdmin.email}\n`);

  console.log('🎉 Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - 2 Companies: ${company.companyName} (ENTERPRISE) + ${startupCo.companyName} (FREE)`);
  console.log(`   - 3 Departments`);
  console.log(`   - 3 Designations`);
  console.log(`   - 3 Employees (with salary structure + annual CTC)`);
  console.log(`   - 6 Users: admin, hr, manager, employee @demotech + superadmin + admin@startupco`);
  console.log(`   - ${attendanceCount} Attendance records`);
  console.log(`   - 2 Leave applications`);
  console.log(`   - ${taxConfigCount} Tax configurations (India + US)`);
  console.log(`   - 1 Salary structure: ${salaryStructure.name}`);
  console.log(`   - 1 Payroll record`);
  console.log(`   - 1 Audit log\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
