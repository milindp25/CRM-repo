/**
 * Database Seed Script
 * Creates test data for development
 */
import "dotenv/config"; // loads .env from current working dir
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });


const prisma = new PrismaClient();

// Simple encryption for demo (use proper encryption in production)
function simpleEncrypt(text: string): string {
  const key = process.env.ENCRYPTION_KEY || 'demo-key-32-bytes-long-exactly!!';
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
      subscriptionTier: 'PREMIUM',
      subscriptionStatus: 'ACTIVE',
      featuresEnabled: ['ATTENDANCE', 'LEAVE', 'PAYROLL', 'PERFORMANCE'],
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

  // 5. Create admin user
  console.log('🔐 Creating admin user...');
  const adminUser = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'admin@demotech.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'COMPANY_ADMIN',
      permissions: ['ALL'],
      employeeId: emp2.id, // Link to HR Manager
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email}\n`);

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

  // 8. Create sample payroll record
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

  console.log('🎉 Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - 1 Company: ${company.companyName}`);
  console.log(`   - 3 Departments`);
  console.log(`   - 3 Designations`);
  console.log(`   - 3 Employees`);
  console.log(`   - 1 Admin User: ${adminUser.email}`);
  console.log(`   - ${attendanceCount} Attendance records`);
  console.log(`   - 2 Leave applications`);
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
