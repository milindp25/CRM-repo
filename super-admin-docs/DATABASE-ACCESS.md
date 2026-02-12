# Database Access Guide

## Overview

Both the Super Admin app and CRM app share the **same Supabase PostgreSQL database**. However, they access it differently:

- **CRM App**: Uses Row-Level Security (RLS) with company-based filtering
- **Super Admin App**: Bypasses RLS using service role key for full database access

## Shared Database Architecture

```
┌─────────────────────────────────────────────────┐
│       Supabase PostgreSQL Database              │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Tables (shared by both apps):            │ │
│  │  • companies                              │ │
│  │  • users                                  │ │
│  │  • employees                              │ │
│  │  • departments                            │ │
│  │  • attendance                             │ │
│  │  • leaves                                 │ │
│  │  • payroll                                │ │
│  │  • audit_logs                             │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Row-Level Security (RLS) Policies:       │ │
│  │  • Filter by companyId for CRM users      │ │
│  │  • Bypass for service role (Super Admin)  │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
         ▲                              ▲
         │                              │
    ┌────┴─────┐                  ┌─────┴────┐
    │ CRM App  │                  │  Super   │
    │          │                  │  Admin   │
    │ Filtered │                  │  Full    │
    │  by RLS  │                  │  Access  │
    └──────────┘                  └──────────┘
```

## Access Patterns

### CRM App Access (Row-Level Security)

The CRM app applies automatic filtering based on `companyId`:

```typescript
// CRM app Prisma query (automatically filtered)
const employees = await prisma.employee.findMany({
  where: {
    // companyId is automatically added by RLS policy
    status: 'ACTIVE'
  }
});

// Result: Only employees from the authenticated user's company
```

### Super Admin Access (Bypasses RLS)

The Super Admin app uses the **service role key** which bypasses RLS:

```typescript
// Super Admin Prisma query (no filtering, sees all data)
const allEmployees = await prisma.employee.findMany({
  where: {
    status: 'ACTIVE'
  },
  include: {
    company: {
      select: {
        companyName: true
      }
    }
  }
});

// Result: Employees from ALL companies
```

## Prisma Client Setup

### Super Admin Prisma Configuration

```typescript
// lib/prisma.ts (Super Admin app)

import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Use service role connection that bypasses RLS
export const prisma = globalThis.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL // Service role key in connection string
    }
  },
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error']
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
```

### Connection String Format

**CRM App** (with RLS):
```
DATABASE_URL="postgresql://postgres.[ref]:password@pooler.supabase.com:6543/postgres"
```

**Super Admin App** (bypasses RLS):
```
DIRECT_URL="postgresql://postgres.[ref]:password@db.supabase.com:5432/postgres"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..." # Service role JWT token
```

## Common Query Patterns

### 1. Get All Companies

```typescript
// Super Admin can query all companies
export async function getAllCompanies() {
  return await prisma.company.findMany({
    select: {
      id: true,
      companyCode: true,
      companyName: true,
      email: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
          employees: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}
```

### 2. Get Company with Full Details

```typescript
export async function getCompanyDetails(companyId: string) {
  return await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true
        }
      },
      employees: {
        where: {
          status: 'ACTIVE'
        },
        select: {
          id: true,
          employeeCode: true,
          firstName: true,
          lastName: true,
          workEmail: true,
          departmentId: true,
          designationId: true
        }
      },
      departments: {
        select: {
          id: true,
          name: true,
          code: true,
          _count: {
            select: {
              employees: true
            }
          }
        }
      }
    }
  });
}
```

### 3. Cross-Company Analytics

```typescript
export async function getSystemAnalytics() {
  const [
    totalCompanies,
    activeCompanies,
    trialCompanies,
    totalUsers,
    totalEmployees,
    activeEmployees
  ] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { isActive: true } }),
    prisma.company.count({
      where: {
        subscriptionStatus: 'TRIAL',
        trialEndsAt: { gt: new Date() }
      }
    }),
    prisma.user.count(),
    prisma.employee.count(),
    prisma.employee.count({ where: { status: 'ACTIVE' } })
  ]);

  return {
    companies: {
      total: totalCompanies,
      active: activeCompanies,
      trial: trialCompanies
    },
    users: {
      total: totalUsers
    },
    employees: {
      total: totalEmployees,
      active: activeEmployees
    }
  };
}
```

### 4. Search Across All Companies

```typescript
export async function searchUsers(query: string) {
  return await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } }
      ]
    },
    include: {
      company: {
        select: {
          companyName: true,
          companyCode: true
        }
      }
    },
    take: 50 // Limit results
  });
}
```

### 5. User Management (Super Admin)

```typescript
// Create Super Admin user (no companyId)
export async function createSuperAdmin(
  email: string,
  firstName: string,
  lastName: string,
  passwordHash: string
) {
  return await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      passwordHash,
      role: 'SUPER_ADMIN',
      permissions: ['ALL'],
      isActive: true,
      emailVerified: true,
      companyId: null, // Super Admins have no company
      employeeId: null  // Super Admins are not employees
    }
  });
}

// Get user from any company
export async function getUserById(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      company: true,
      employee: true
    }
  });
}
```

## Schema Considerations

### Super Admin User Model

Super Admin users differ from regular users:

```prisma
model User {
  id        String   @id @default(uuid()) @db.Uuid
  companyId String?  @map("company_id") @db.Uuid // NULL for Super Admins

  email         String   @db.VarChar(255)
  passwordHash  String?  @map("password_hash") @db.Text

  firstName String  @map("first_name") @db.VarChar(100)
  lastName  String  @map("last_name") @db.VarChar(100)

  role        String   @db.VarChar(50) // 'SUPER_ADMIN' for Super Admins
  permissions String[] @default([])

  employeeId String? @unique @map("employee_id") @db.Uuid // NULL for Super Admins

  company  Company?  @relation(fields: [companyId], references: [id])
  employee Employee? @relation(fields: [employeeId], references: [id])

  @@map("users")
}
```

**Key differences:**
- `companyId` is `NULL` for Super Admins
- `role` is `'SUPER_ADMIN'`
- `employeeId` is `NULL` (Super Admins aren't employees)
- `permissions` typically includes `['ALL']`

### Audit Logs for Super Admin Actions

All Super Admin actions should be logged:

```typescript
export async function logSuperAdminAction(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  oldValues: any,
  newValues: any,
  request: Request
) {
  await prisma.auditLog.create({
    data: {
      userId,
      userEmail: await getUserEmail(userId),
      action, // e.g., 'CREATE_COMPANY', 'UPDATE_SUBSCRIPTION', 'SUSPEND_USER'
      resourceType, // e.g., 'COMPANY', 'USER', 'SUBSCRIPTION'
      resourceId,
      oldValues,
      newValues,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
      success: true,
      companyId: null // Super Admin actions are platform-level
    }
  });
}
```

## Type Sharing Strategy

### Option 1: Duplicate Prisma Schema (Recommended for Start)

**Pros:**
- Simple to set up
- No external dependencies
- Each app is independent

**Cons:**
- Must manually sync schema changes
- Duplication of types

**Implementation:**
1. Copy `prisma/` folder from CRM repo to Super Admin repo
2. Run `npx prisma generate` in Super Admin repo
3. When schema changes, repeat steps 1-2

```bash
# Copy Prisma schema from CRM repo
cp -r ../CRM-repo/packages/database/prisma ./prisma

# Generate Prisma client
npx prisma generate

# No need to run migrations (database already has the schema)
```

### Option 2: Shared npm Package (For Production)

**Pros:**
- Single source of truth
- Automatic type updates
- Better for long-term maintenance

**Cons:**
- Requires npm registry (private or public)
- More complex setup

**Implementation:**
1. Create `@hrplatform/database` package
2. Publish to private npm registry
3. Install in both repos

```bash
# In CRM repo
cd packages/database
npm publish --access private

# In Super Admin repo
npm install @hrplatform/database
```

## Database Migration Coordination

### Migration Strategy

**Important:** Always run migrations from the **CRM repo** first!

1. **Create migration in CRM repo:**
   ```bash
   cd packages/database
   npx prisma migrate dev --name add_new_field
   ```

2. **Apply to Supabase database:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Update Super Admin repo:**
   ```bash
   # Copy updated schema
   cp ../CRM-repo/packages/database/prisma/schema.prisma ./prisma/

   # Regenerate client
   npx prisma generate
   ```

4. **Deploy both apps:**
   - Deploy CRM app first
   - Then deploy Super Admin app

## Best Practices

### 1. Always Use Transactions for Multi-Table Operations

```typescript
export async function createCompanyWithAdmin(
  companyData: CompanyData,
  adminData: UserData
) {
  return await prisma.$transaction(async (tx) => {
    // Create company
    const company = await tx.company.create({
      data: companyData
    });

    // Create admin user
    const admin = await tx.user.create({
      data: {
        ...adminData,
        companyId: company.id,
        role: 'COMPANY_ADMIN'
      }
    });

    // Log action
    await tx.auditLog.create({
      data: {
        userId: getSuperAdminId(),
        action: 'CREATE_COMPANY',
        resourceType: 'COMPANY',
        resourceId: company.id,
        newValues: { companyId: company.id, adminEmail: admin.email },
        success: true
      }
    });

    return { company, admin };
  });
}
```

### 2. Use Pagination for Large Queries

```typescript
export async function getCompaniesPaginated(
  page: number = 1,
  pageSize: number = 20
) {
  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.company.count()
  ]);

  return {
    companies,
    pagination: {
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      totalItems: total
    }
  };
}
```

### 3. Validate Company Exists Before Operations

```typescript
export async function updateCompany(
  companyId: string,
  updates: Partial<Company>
) {
  // Verify company exists
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });

  if (!company) {
    throw new Error('Company not found');
  }

  // Perform update
  return await prisma.company.update({
    where: { id: companyId },
    data: updates
  });
}
```

## Next Steps

- Review [API-SPEC.md](./API-SPEC.md) for API endpoint implementations
- See [INTEGRATION.md](./INTEGRATION.md) for CRM app integration patterns
- Check [PRISMA-SETUP.md](./PRISMA-SETUP.md) for detailed Prisma setup instructions
