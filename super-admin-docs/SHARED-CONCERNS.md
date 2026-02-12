# Shared Concerns & Coordination Guide

Critical considerations and coordination strategies when running CRM and Super Admin apps in separate repositories.

## Overview

Running the CRM app and Super Admin app in separate repositories provides independence but introduces coordination challenges. This document outlines the shared concerns and how to manage them.

## Shared Resources

### 1. Database Schema

**Challenge**: Both apps must use the **exact same Prisma schema**.

**Impact**:
- Schema changes affect both apps
- Migrations must be coordinated
- Type mismatches cause runtime errors

**Coordination Strategy**:

```bash
# ALWAYS follow this order:

# 1. Create migration in CRM repo (source of truth)
cd CRM-repo/packages/database
npx prisma migrate dev --name add_feature_column

# 2. Apply migration to Supabase
npx prisma migrate deploy

# 3. Test CRM app with new schema
cd ../..
npm run dev
# Verify feature works

# 4. Copy schema to Super Admin repo
cp packages/database/prisma/schema.prisma ../super-admin/prisma/

# 5. Regenerate Prisma client in Super Admin
cd ../super-admin
npx prisma generate

# 6. Test Super Admin app
npm run dev
# Verify queries still work

# 7. Deploy CRM app first
cd ../CRM-repo
vercel --prod

# 8. Then deploy Super Admin app
cd ../super-admin
vercel --prod
```

**Best Practice**: Create a checklist and follow it for every schema change.

### 2. TypeScript Types

**Challenge**: Both apps need the same TypeScript types for shared models.

**Impact**:
- Type drift causes bugs
- API contracts break
- Integration issues

**Solutions**:

#### Option A: Manual Synchronization (Current)

```bash
# After schema change in CRM repo:
# 1. Generate Prisma client
npx prisma generate

# 2. Copy generated types to Super Admin
cp packages/database/prisma/schema.prisma ../super-admin/prisma/
cd ../super-admin
npx prisma generate
```

**Pros**: Simple, no external dependencies
**Cons**: Manual process, error-prone

#### Option B: Shared Package (Recommended)

```bash
# 1. Publish database package from CRM repo
cd CRM-repo/packages/database
npm version patch
npm publish --access private

# 2. Update Super Admin dependency
cd ../../super-admin
npm install @hrplatform/database@latest
```

**Pros**: Automatic type sync, single source of truth
**Cons**: Requires private npm registry (or GitHub packages)

#### Option C: Git Submodule (Not Recommended)

```bash
# In Super Admin repo
git submodule add ../CRM-repo/packages/database shared-database
```

**Pros**: Always in sync
**Cons**: Complex, submodules are difficult to work with

**Recommendation**: Start with Option A, migrate to Option B when the team is comfortable.

### 3. Environment Variables

**Challenge**: Both apps need some shared values, some unique.

**Shared Variables** (same in both):
```env
DATABASE_URL=<same-supabase-url>
DIRECT_URL=<same-supabase-url>
NEXT_PUBLIC_SUPABASE_URL=<same>
```

**Unique Variables** (different in each):
```env
# CRM App
JWT_SECRET=<crm-specific-secret>
APP_PORT=3000

# Super Admin
SUPER_ADMIN_JWT_SECRET=<admin-specific-secret>
APP_PORT=3001
```

**Coordination Strategy**:

Create a shared document with:
- Supabase credentials (shared)
- Stripe/Razorpay keys (shared)
- JWT secrets (document that they're different!)

**DO NOT** put this document in git!

### 4. Authentication

**Challenge**: Different JWT secrets but same User table.

**Impact**:
- CRM tokens don't work in Super Admin
- Super Admin tokens don't work in CRM
- User impersonation needs special handling

**How It Works**:

```typescript
// CRM App: Issues JWT with CRM secret
const crmToken = jwt.sign(
  { userId, companyId, role },
  process.env.JWT_SECRET // CRM secret
);

// Super Admin: Issues JWT with Super Admin secret
const adminToken = jwt.sign(
  { userId, role: 'SUPER_ADMIN' },
  process.env.SUPER_ADMIN_JWT_SECRET // Different secret!
);

// For impersonation: Super Admin generates CRM token
const impersonationToken = jwt.sign(
  { userId, companyId, role, impersonatedBy: adminId },
  process.env.CRM_JWT_SECRET // Uses CRM secret!
);
```

**Coordination**: Document which secret is used where.

### 5. Billing Webhooks

**Challenge**: Stripe/Razorpay webhooks go to Super Admin, but CRM needs to know.

**Flow**:

```
Payment completed
    ↓
Stripe webhook → Super Admin
    ↓
Super Admin updates database
    ↓
CRM reads updated database (next request)
```

**Coordination**: Super Admin is responsible for webhook handling.

### 6. Audit Logs

**Challenge**: Both apps write to the same `audit_logs` table.

**Impact**:
- Need consistent log format
- Need to differentiate source
- Need companyId for CRM, NULL for Super Admin

**Standard Format**:

```typescript
interface AuditLogEntry {
  userId: string;
  userEmail: string;
  action: string; // Use consistent action names
  resourceType: string; // Use consistent resource types
  resourceId: string;
  companyId: string | null; // NULL for Super Admin actions
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  createdAt: Date;
}
```

**Coordination**: Maintain a shared document of:
- Standard action names (CREATE_EMPLOYEE, UPDATE_COMPANY, etc.)
- Standard resource types (EMPLOYEE, COMPANY, USER, etc.)

## Communication Patterns

### Pattern 1: Database as Message Bus (Current)

Both apps communicate through shared database state.

**Example:**

```typescript
// Super Admin: Suspend company
await prisma.company.update({
  where: { id: companyId },
  data: { isActive: false }
});

// CRM App: Check on every request
const company = await prisma.company.findUnique({
  where: { id: user.companyId }
});

if (!company?.isActive) {
  throw new Error('Account suspended');
}
```

**Pros**: Simple, no extra infrastructure
**Cons**: Not real-time, requires polling

### Pattern 2: Webhooks (Future)

Super Admin notifies CRM of changes.

**Example:**

```typescript
// Super Admin: After company update
await fetch(`${CRM_URL}/api/webhooks/company-updated`, {
  method: 'POST',
  body: JSON.stringify({ companyId, changes })
});

// CRM App: Handle webhook
export async function POST(request) {
  const { companyId } = await request.json();
  // Invalidate cache, send notification, etc.
}
```

**Pros**: Real-time updates
**Cons**: Requires webhook infrastructure, error handling

### Pattern 3: Redis Pub/Sub (Advanced)

Real-time event streaming.

**Pros**: Instant updates, decoupled
**Cons**: Requires Redis, more complex

**Recommendation**: Start with Pattern 1, add Pattern 2 when needed.

## Breaking Changes

### What is a Breaking Change?

Changes that require both apps to be updated simultaneously:

- ❌ Removing database columns (breaks queries)
- ❌ Renaming database fields (breaks queries)
- ❌ Changing data types (breaks type safety)
- ❌ Changing foreign key relationships
- ❌ Removing enum values

**Safe Changes**:
- ✅ Adding new optional columns
- ✅ Adding new tables
- ✅ Adding enum values (at end)

### Handling Breaking Changes

**Process**:

1. **Plan**: Document the change and impact
2. **Communicate**: Notify team of breaking change
3. **Prepare**: Update both codebases locally
4. **Test**: Verify both apps work with changes
5. **Deploy**: CRM first, then Super Admin (within same day)
6. **Verify**: Monitor logs for errors

**Example Timeline**:

```
Day 1: Plan migration
Day 2: Create PR in CRM repo
Day 3: Create PR in Super Admin repo
Day 4: Review both PRs
Day 5: Merge CRM PR → Deploy CRM
Day 5 (1hr later): Merge Admin PR → Deploy Super Admin
Day 6: Verify everything works
```

## Version Compatibility Matrix

Maintain a compatibility matrix:

| CRM Version | Super Admin Version | Schema Version | Compatible? |
|-------------|---------------------|----------------|-------------|
| v1.0.0 | v1.0.0 | v1 | ✅ |
| v1.1.0 | v1.0.0 | v1 | ✅ |
| v1.1.0 | v1.1.0 | v2 | ✅ |
| v1.2.0 | v1.1.0 | v2 | ⚠️ Partial |
| v1.2.0 | v1.0.0 | v2 vs v1 | ❌ No |

## Deployment Coordination

### Deployment Order

**Always deploy in this order:**

1. **Database migrations** (from CRM repo)
2. **CRM app** (reads from database)
3. **Super Admin app** (also reads from database)

**Why this order?**
- Database must be updated first (both apps depend on it)
- CRM is user-facing (more critical)
- Super Admin is internal (lower risk)

### Rollback Strategy

If Super Admin deployment fails:
1. Rollback Super Admin to previous version
2. CRM continues working (unaffected)
3. Fix Super Admin
4. Redeploy

If CRM deployment fails:
1. Rollback CRM to previous version
2. Check if schema change is problematic
3. May need to rollback database migration
4. May need to rollback Super Admin too

**Critical**: Always be able to rollback database migrations!

```bash
# Create reversible migrations
npx prisma migrate dev --name add_column

# If needed, manually create down migration
# migrations/xxx_add_column/migration.sql
# Add DROP COLUMN statement for rollback
```

## Testing Strategy

### Test Both Apps Together

Before deploying:

```bash
# 1. Start both apps locally
cd CRM-repo && npm run dev &
cd super-admin && npm run dev &

# 2. Test integration
# - Super Admin creates company
# - Verify company appears in CRM
# - Super Admin updates subscription
# - Verify CRM enforces new limits

# 3. Test edge cases
# - Super Admin suspends company
# - Verify CRM blocks login
# - Super Admin restores company
# - Verify CRM allows login
```

### Automated Integration Tests

Create integration tests that span both apps:

```typescript
// integration-tests/company-lifecycle.test.ts

test('Super Admin can create company and CRM user can login', async () => {
  // 1. Super Admin creates company
  const company = await superAdmin.createCompany({
    name: 'Test Corp',
    adminEmail: 'admin@test.com'
  });

  // 2. CRM user can login
  const loginResult = await crm.login({
    email: 'admin@test.com',
    password: 'temp-password'
  });

  expect(loginResult.success).toBe(true);
});
```

## Documentation

### Maintain Shared Documentation

Create a shared document (outside both repos) with:

1. **Schema Change Process**
   - Step-by-step checklist
   - Who approves schema changes
   - Testing requirements

2. **Deployment Runbook**
   - Pre-deployment checklist
   - Deployment order
   - Rollback procedure
   - Contact information

3. **API Contracts**
   - Shared data models
   - Action names for audit logs
   - Error codes

4. **Environment Setup**
   - Supabase credentials
   - Stripe/Razorpay keys
   - Required environment variables

### Use CHANGELOG.md

In both repos, maintain CHANGELOG.md:

```markdown
# Changelog

## [1.1.0] - 2024-01-15

### Added
- New `features_enabled` column on Company table

### Breaking Changes
- None

### Requires
- Super Admin v1.1.0 or later
- Database schema v2
```

## Recommendations

### For Small Teams (1-5 developers)

- ✅ Use Pattern 1 (Database as message bus)
- ✅ Manual schema synchronization
- ✅ Deploy both apps close together (same day)
- ✅ Shared documentation in Google Docs/Notion

### For Growing Teams (5-15 developers)

- ✅ Use Pattern 2 (Webhooks for critical updates)
- ✅ Shared npm package for types
- ✅ Automated integration tests
- ✅ Deployment runbook in wiki

### For Large Teams (15+ developers)

- ✅ Use Pattern 3 (Redis pub/sub)
- ✅ Monorepo with shared packages
- ✅ Automated deployment pipeline
- ✅ Feature flags for gradual rollouts

## When to Merge Repos

Consider moving to a monorepo if:

- ❌ Schema sync is causing frequent issues
- ❌ Breaking changes require complex coordination
- ❌ Deployment ordering is causing problems
- ❌ Team is spending too much time on coordination
- ❌ Type drift is causing bugs

**Signs it's working well**:
- ✅ Deployments are smooth
- ✅ Schema changes are infrequent
- ✅ Teams are independent
- ✅ Clear ownership boundaries

## Next Steps

1. Create shared documentation for your team
2. Set up integration tests
3. Document deployment process
4. Plan strategy for first schema change
5. Review [INTEGRATION.md](./INTEGRATION.md) for patterns
6. See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment guide
