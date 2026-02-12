# Prisma Setup Guide

Complete guide for setting up Prisma in the Super Admin app using the shared database schema.

## Overview

The Super Admin app uses the **same Prisma schema** as the CRM app. Both apps connect to the same Supabase database but with different access levels:

- **CRM App**: Row-Level Security (RLS) filtered by companyId
- **Super Admin App**: Service role key, bypasses RLS, sees all data

## Option 1: Copy Schema (Recommended for Start)

### Step 1: Copy Prisma Folder

```bash
# From Super Admin repo root

# If CRM repo is at ../CRM-repo/
cp -r ../CRM-repo/packages/database/prisma ./prisma

# Verify files copied
ls prisma/
# Should see: schema.prisma, migrations/
```

### Step 2: Install Prisma Dependencies

```bash
npm install @prisma/client@5.9.1
npm install -D prisma@5.9.1
```

### Step 3: Configure Environment Variables

Create or update `.env.local`:

```env
# Use SAME database as CRM app
DATABASE_URL="postgresql://postgres.xxx:password@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.xxx:password@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# CRITICAL: Add service role key
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJI...your-service-role-key"
```

**Important**: Use the SAME values as CRM app for database URLs!

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

This creates `node_modules/.prisma/client` with TypeScript types.

### Step 5: Create Prisma Client Wrapper

Create `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Initialize Prisma with service role access
export const prisma = globalThis.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL // Service role connection
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

### Step 6: Verify Connection

Create `scripts/test-db.ts`:

```typescript
import { prisma } from '../lib/prisma';

async function main() {
  console.log('Testing database connection...');

  const companies = await prisma.company.findMany({
    take: 5,
    select: {
      id: true,
      companyName: true,
      subscriptionTier: true
    }
  });

  console.log(`✅ Found ${companies.length} companies`);
  console.log(companies);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run test:

```bash
npx tsx scripts/test-db.ts
```

### Step 7: Add Postinstall Script

In `package.json`, add:

```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

This ensures Prisma client is generated during deployment.

## Option 2: Shared Package (Production)

### Step 1: Create Database Package in CRM Repo

```bash
# In CRM repo
cd packages/database

# Update package.json
{
  "name": "@hrplatform/database",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist", "prisma"],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build && prisma generate"
  }
}

# Create src/index.ts
export * from '@prisma/client';
export { prisma } from './client';

# Create src/client.ts
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
```

### Step 2: Publish to Private NPM

```bash
# In CRM repo packages/database/
npm login
npm publish --access private
```

### Step 3: Install in Super Admin

```bash
# In Super Admin repo
npm install @hrplatform/database@latest
```

### Step 4: Use Shared Package

```typescript
// lib/prisma.ts
import { PrismaClient } from '@hrplatform/database';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
    }
  }
});
```

## Schema Synchronization

### When Schema Changes in CRM Repo

#### Manual Copy Approach:

```bash
# 1. In CRM repo: Create migration
cd packages/database
npx prisma migrate dev --name add_new_field

# 2. Apply to database
npx prisma migrate deploy

# 3. In Super Admin repo: Copy updated schema
cp ../CRM-repo/packages/database/prisma/schema.prisma ./prisma/

# 4. Regenerate Prisma client
npx prisma generate

# 5. Update imports if types changed
# (TypeScript will show errors for changed types)

# 6. Test locally
npm run dev

# 7. Deploy both apps (CRM first, then Super Admin)
```

#### Shared Package Approach:

```bash
# 1. In CRM repo: Create migration and publish
cd packages/database
npx prisma migrate dev --name add_new_field
npx prisma migrate deploy
npm version patch
npm publish

# 2. In Super Admin repo: Update package
npm install @hrplatform/database@latest

# 3. Test locally
npm run dev

# 4. Deploy both apps
```

## Prisma Studio

### Launch Prisma Studio

```bash
npx prisma studio
```

Opens browser at http://localhost:5555

**Warning**: Prisma Studio in Super Admin sees ALL data (no RLS filtering)!

### Safe Usage

Only use Prisma Studio for:
- ✅ Viewing data across companies
- ✅ Creating test companies
- ✅ Creating Super Admin users
- ✅ Debugging issues

Avoid:
- ❌ Bulk edits (use scripts with audit logging)
- ❌ Deleting production data
- ❌ Modifying critical records

## Common Prisma Operations

### 1. Query All Companies

```typescript
import { prisma } from '@/lib/prisma';

// Super Admin sees all companies (no RLS filtering)
export async function getAllCompanies() {
  return await prisma.company.findMany({
    include: {
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

### 2. Create Company with Admin User

```typescript
export async function createCompanyWithAdmin(
  companyData: CompanyCreateInput,
  adminData: UserCreateInput
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
        role: 'COMPANY_ADMIN',
        permissions: ['ALL']
      }
    });

    // Log action
    await tx.auditLog.create({
      data: {
        userId: getSuperAdminId(),
        action: 'CREATE_COMPANY',
        resourceType: 'COMPANY',
        resourceId: company.id,
        success: true
      }
    });

    return { company, admin };
  });
}
```

### 3. Update Subscription

```typescript
export async function updateSubscription(
  companyId: string,
  tier: string,
  status: string
) {
  return await prisma.company.update({
    where: { id: companyId },
    data: {
      subscriptionTier: tier,
      subscriptionStatus: status,
      updatedAt: new Date()
    }
  });
}
```

### 4. Cross-Company Analytics

```typescript
export async function getSystemStats() {
  // Super Admin can query across all companies
  const [totalCompanies, activeCompanies, totalEmployees] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { isActive: true } }),
    prisma.employee.count({ where: { status: 'ACTIVE' } })
  ]);

  return {
    totalCompanies,
    activeCompanies,
    totalEmployees
  };
}
```

## Migrations

### Important: Never Run Migrations from Super Admin!

**Always run migrations from CRM repo only.**

Why?
- CRM repo is the source of truth
- Avoids migration conflicts
- Keeps both apps in sync

### If You Accidentally Created a Migration

```bash
# Delete the migration
rm -rf prisma/migrations/[migration-name]

# Reset Prisma
npx prisma migrate reset

# Copy schema from CRM repo
cp ../CRM-repo/packages/database/prisma/schema.prisma ./prisma/

# Regenerate client
npx prisma generate
```

## Troubleshooting

### Error: P1001 - Can't reach database

**Cause**: Wrong DATABASE_URL or firewall blocking connection

**Solution**:
```bash
# 1. Verify connection string
echo $DATABASE_URL

# 2. Test connection
npx prisma db pull

# 3. Check Supabase allows connections
# Go to Supabase Dashboard → Settings → Database → Connection pooling
```

### Error: P2002 - Unique constraint violation

**Cause**: Trying to create duplicate record

**Solution**:
```typescript
// Use upsert instead of create
await prisma.company.upsert({
  where: { companyCode: 'COMP001' },
  update: { /* update data */ },
  create: { /* create data */ }
});
```

### Error: Prisma client not generated

**Cause**: `prisma generate` not run

**Solution**:
```bash
# Generate client
npx prisma generate

# Or add to package.json scripts
"postinstall": "prisma generate"
```

### Types are out of sync

**Cause**: Schema changed but client not regenerated

**Solution**:
```bash
# 1. Copy latest schema
cp ../CRM-repo/packages/database/prisma/schema.prisma ./prisma/

# 2. Regenerate client
npx prisma generate

# 3. Restart TypeScript server in VS Code
# Cmd+Shift+P → TypeScript: Restart TS Server
```

### RLS is blocking queries

**Cause**: Not using service role key

**Solution**:
```env
# Verify SUPABASE_SERVICE_ROLE_KEY is set in .env.local
SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."

# And DIRECT_URL uses service role key
DIRECT_URL="postgresql://postgres.[ref]:[password]@db.supabase.com:5432/postgres"
```

## Best Practices

### 1. Always Use Transactions for Multi-Table Operations

```typescript
await prisma.$transaction(async (tx) => {
  // All or nothing
});
```

### 2. Use Pagination for Large Queries

```typescript
const companies = await prisma.company.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize
});
```

### 3. Include Audit Logging

```typescript
// After every significant operation
await prisma.auditLog.create({ /* log data */ });
```

### 4. Use TypeScript Types from Prisma

```typescript
import { Company, User, Prisma } from '@prisma/client';

// Type-safe queries
const companies: Company[] = await prisma.company.findMany();
```

## Next Steps

- Review [DATABASE-ACCESS.md](./DATABASE-ACCESS.md) for query patterns
- See [INTEGRATION.md](./INTEGRATION.md) for CRM app coordination
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
