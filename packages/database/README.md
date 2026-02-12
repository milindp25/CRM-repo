# @hrplatform/database

Prisma-based database package for HRPlatform with Supabase PostgreSQL.

## Features

- ✅ **Multi-tenancy** with Row-Level Security (RLS)
- ✅ **Encrypted PII fields** (Aadhaar, PAN, Bank details)
- ✅ **Complete HRIS schema** (Employees, Attendance, Leaves, Payroll)
- ✅ **Audit logging** (7-year retention for compliance)
- ✅ **UUID primary keys**
- ✅ **Soft deletes** (deleted_at)
- ✅ **Timestamp tracking** (created_at, updated_at)

## Schema Overview

### Core Tables
- **companies** - Multi-tenant root
- **users** - Authentication & authorization
- **employees** - Employee master data
- **departments** - Organizational structure
- **designations** - Job titles/roles

### Time & Attendance
- **attendance** - Daily attendance records
- **leaves** - Leave applications & approvals

### Payroll
- **payroll** - Monthly payroll records (encrypted salary data)

### Compliance
- **audit_logs** - Audit trail for compliance

## Setup

### 1. Install Dependencies

```bash
cd packages/database
yarn install
```

### 2. Generate Prisma Client

```bash
yarn db:generate
```

### 3. Push Schema to Database (First Time)

```bash
yarn db:push
```

Or create a migration:

```bash
yarn db:migrate:dev --name init
```

### 4. Seed Test Data

```bash
yarn db:seed
```

## Available Commands

```bash
# Generate Prisma Client
yarn db:generate

# Push schema to DB (no migration)
yarn db:push

# Create migration
yarn db:migrate:create

# Run migrations
yarn db:migrate

# Run migrations (dev)
yarn db:migrate:dev

# Open Prisma Studio (Database GUI)
yarn db:studio

# Seed database
yarn db:seed

# Reset database (destructive!)
yarn db:reset
```

## Usage in Code

```typescript
import { prisma } from '@hrplatform/database';

// Get all employees for a company
const employees = await prisma.employee.findMany({
  where: {
    companyId: 'company-uuid',
    deletedAt: null,
  },
  include: {
    department: true,
    designation: true,
  },
});

// Create attendance record
const attendance = await prisma.attendance.create({
  data: {
    companyId: 'company-uuid',
    employeeId: 'employee-uuid',
    attendanceDate: new Date(),
    checkInTime: new Date(),
    status: 'PRESENT',
  },
});
```

## Multi-Tenancy

All tables (except `companies`) have a `companyId` field for tenant isolation.

**Always filter by companyId:**

```typescript
// ✅ Good - includes companyId
const employees = await prisma.employee.findMany({
  where: { companyId: userCompanyId },
});

// ❌ Bad - missing companyId (data leak!)
const employees = await prisma.employee.findMany();
```

## Encrypted Fields

Some fields store encrypted data:

- `aadhaarEncrypted`
- `panEncrypted`
- `bankAccountEncrypted`
- `personalEmailEncrypted`
- `personalPhoneEncrypted`
- Salary fields in payroll

**Important:** These fields store encrypted strings. You must encrypt before storing and decrypt after reading using the encryption service from `@hrplatform/core`.

## Row-Level Security (RLS)

Supabase RLS is enabled on all tables. This provides automatic tenant isolation at the database level.

When you enable RLS policies (next step), users can only access data for their company automatically.

## Test Data

After seeding, you'll have:

- 1 Demo company
- 3 Departments (Engineering, HR, Sales)
- 3 Designations
- 3 Employees
- 1 Admin user (`admin@demotech.com`)
- 7 days of attendance records
- 2 Leave applications
- 1 Payroll record
- 1 Audit log

## Next Steps

1. ✅ Schema created
2. ⏳ Enable Row-Level Security policies in Supabase
3. ⏳ Create encryption service for PII
4. ⏳ Build API endpoints
