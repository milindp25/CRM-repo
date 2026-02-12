# Integration Guide

How the Super Admin app integrates with the CRM app and shared resources.

## Overview

The Super Admin and CRM apps are separate applications that share:
- **Database**: Same Supabase PostgreSQL database
- **Database Schema**: Same Prisma schema (must stay in sync)
- **Authentication**: Separate JWT secrets but same User table
- **Webhooks**: May trigger updates in both apps

## Shared Database Integration

### Connection Model

```
┌─────────────────────────────────────────────┐
│         Supabase Database                   │
│  (Single source of truth for both apps)     │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
    ┌───▼────┐         ┌────▼───┐
    │  CRM   │         │ Super  │
    │  App   │         │ Admin  │
    └────────┘         └────────┘
```

### Key Integration Points

#### 1. Company Management

When Super Admin creates a company:
1. Super Admin creates Company record
2. Super Admin creates initial admin User
3. CRM app automatically sees new company (shared database)
4. Admin user can login to CRM app immediately

#### 2. User Management

When Super Admin resets a password:
1. Super Admin updates User.passwordHash
2. Next CRM app login uses new password
3. User is automatically logged out from CRM (if online)

#### 3. Subscription Updates

When Super Admin changes subscription:
1. Super Admin updates Company.subscriptionTier
2. CRM app reads updated tier on next request
3. Feature flags are updated accordingly
4. CRM app enforces new limits (e.g., employee count)

## Cross-App Communication

### Option 1: Database as Message Bus (Current)

Both apps communicate through shared database state:

```typescript
// Super Admin: Update company status
await prisma.company.update({
  where: { id: companyId },
  data: {
    isActive: false, // Suspend company
    updatedAt: new Date()
  }
});

// CRM App: Check on every request
const company = await prisma.company.findUnique({
  where: { id: user.companyId }
});

if (!company?.isActive) {
  throw new Error('Your company account has been suspended');
}
```

### Option 2: Webhooks (Future Enhancement)

Super Admin can notify CRM app of changes:

```typescript
// Super Admin: After company update
await fetch(`${process.env.CRM_APP_URL}/api/webhooks/company-updated`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Secret': process.env.WEBHOOK_SECRET
  },
  body: JSON.stringify({
    companyId,
    event: 'company.subscription.updated',
    data: { tier: 'ENTERPRISE' }
  })
});

// CRM App: Handle webhook
export async function POST(request: Request) {
  const payload = await request.json();

  // Invalidate cache, send notifications, etc.
  await handleCompanyUpdate(payload);

  return Response.json({ received: true });
}
```

### Option 3: Shared Redis Pub/Sub (Advanced)

Use Redis for real-time updates:

```typescript
// Super Admin: Publish event
await redis.publish('company-updates', JSON.stringify({
  companyId,
  event: 'subscription.updated',
  data: { tier: 'ENTERPRISE' }
}));

// CRM App: Subscribe to events
redis.subscribe('company-updates', (message) => {
  const event = JSON.parse(message);
  handleCompanyUpdate(event);
});
```

## Feature Flag Coordination

### Enabling Features for a Company

```typescript
// Super Admin: Enable feature
await prisma.company.update({
  where: { id: companyId },
  data: {
    featuresEnabled: {
      push: 'PERFORMANCE_REVIEWS' // Add new feature
    }
  }
});

// CRM App: Check feature access
function hasFeature(companyId: string, feature: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { featuresEnabled: true }
  });

  return company?.featuresEnabled.includes(feature) ?? false;
}
```

### Global Feature Flags

Use a shared `system_settings` table:

```prisma
model SystemSetting {
  id    String @id @default(uuid())
  key   String @unique
  value Json
  updatedAt DateTime @updatedAt

  @@map("system_settings")
}
```

```typescript
// Super Admin: Set global flag
await prisma.systemSetting.upsert({
  where: { key: 'features.performance-reviews.enabled' },
  create: { key: 'features.performance-reviews.enabled', value: true },
  update: { value: true }
});

// CRM App: Read global flag
const setting = await prisma.systemSetting.findUnique({
  where: { key: 'features.performance-reviews.enabled' }
});

const isEnabled = setting?.value === true;
```

## Authentication Integration

### Separate Auth Systems

Each app has its own JWT secrets:

```env
# Super Admin .env
SUPER_ADMIN_JWT_SECRET="super-admin-secret-123"

# CRM App .env
JWT_SECRET="crm-app-secret-456"
```

**Important**: Super Admin tokens don't work in CRM app and vice versa.

### User Impersonation

Super Admin can impersonate company users:

```typescript
// Super Admin: Generate impersonation token
export async function impersonateUser(
  superAdminId: string,
  targetUserId: string
) {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { company: true }
  });

  if (!user) throw new Error('User not found');

  // Generate CRM app JWT (using CRM's secret!)
  const token = jwt.sign(
    {
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      impersonatedBy: superAdminId, // Track impersonation
      expiresIn: '1h' // Short-lived
    },
    process.env.CRM_JWT_SECRET!, // Use CRM's secret
    { expiresIn: '1h' }
  );

  // Log impersonation
  await prisma.auditLog.create({
    data: {
      userId: superAdminId,
      action: 'IMPERSONATE_USER',
      resourceType: 'USER',
      resourceId: user.id,
      success: true
    }
  });

  return { token, user };
}
```

## Schema Synchronization

### Migration Workflow

**Critical**: Always run migrations from CRM repo first!

```bash
# 1. CRM Repo: Create migration
cd packages/database
npx prisma migrate dev --name add_new_column

# 2. CRM Repo: Apply to Supabase
npx prisma migrate deploy

# 3. Super Admin Repo: Copy schema
cp ../CRM-repo/packages/database/prisma/schema.prisma ./prisma/

# 4. Super Admin Repo: Generate client
npx prisma generate

# 5. Deploy CRM app first
cd ../../
vercel --prod

# 6. Deploy Super Admin app second
cd ../super-admin/
vercel --prod
```

### Type Sharing Strategies

#### Strategy 1: Manual Copy (Current)

Copy generated types when schema changes:

```typescript
// After prisma generate in CRM repo:
// Copy types to shared location or duplicate in Super Admin
```

**Pros**: Simple, no external dependencies
**Cons**: Manual work, risk of drift

#### Strategy 2: Shared Package (Recommended)

Create `@hrplatform/database` package:

```bash
# In CRM repo
cd packages/database
npm publish --access private

# In Super Admin repo
npm install @hrplatform/database@latest
```

**Pros**: Single source of truth, automatic updates
**Cons**: Requires private npm registry

#### Strategy 3: Git Submodule (Not Recommended)

```bash
# In Super Admin repo
git submodule add ../CRM-repo/packages/database prisma-shared
```

**Pros**: Always in sync
**Cons**: Complex, error-prone

## Billing Integration

### Payment Flow

```
User in CRM App
    ↓
Redirected to checkout (Stripe/Razorpay)
    ↓
Payment completed
    ↓
Webhook received by Super Admin
    ↓
Super Admin updates Company.subscriptionStatus
    ↓
CRM App sees updated status (shared DB)
```

### Implementation

```typescript
// CRM App: Generate checkout link
export async function createCheckoutSession(companyId: string, tier: string) {
  // Call Super Admin API to create checkout
  const response = await fetch(
    `${process.env.SUPER_ADMIN_URL}/api/billing/checkout`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.INTERNAL_API_KEY
      },
      body: JSON.stringify({ companyId, tier })
    }
  );

  const { checkoutUrl } = await response.json();
  return checkoutUrl;
}

// Super Admin: Handle webhook
export async function handleStripeWebhook(event: Stripe.Event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const companyId = session.metadata.companyId;

    // Update company in shared database
    await prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionTier: session.metadata.tier
      }
    });

    // CRM app will see this change automatically
  }
}
```

## Audit Trail Integration

### Shared Audit Logs

Both apps write to the same `audit_logs` table:

```typescript
// Super Admin: Log company creation
await prisma.auditLog.create({
  data: {
    userId: superAdminId,
    userEmail: 'admin@hrplatform.com',
    action: 'CREATE_COMPANY',
    resourceType: 'COMPANY',
    resourceId: company.id,
    companyId: null, // Super Admin actions have no company
    success: true
  }
});

// CRM App: Log employee creation
await prisma.auditLog.create({
  data: {
    userId: user.id,
    userEmail: user.email,
    action: 'CREATE_EMPLOYEE',
    resourceType: 'EMPLOYEE',
    resourceId: employee.id,
    companyId: user.companyId, // CRM actions have companyId
    success: true
  }
});

// Super Admin: View all audit logs (no filtering)
const allLogs = await prisma.auditLog.findMany({
  orderBy: { createdAt: 'desc' },
  take: 100
});

// CRM App: View company audit logs (filtered by RLS)
const companyLogs = await prisma.auditLog.findMany({
  where: { companyId: user.companyId },
  orderBy: { createdAt: 'desc' }
});
```

## Monitoring Integration

### Shared Metrics

Both apps can contribute to system metrics:

```typescript
// Shared metrics tracking
interface SystemMetrics {
  timestamp: Date;
  source: 'CRM' | 'SUPER_ADMIN';
  metric: string;
  value: number;
  metadata?: any;
}

// CRM App: Track API calls
await trackMetric({
  source: 'CRM',
  metric: 'api.calls',
  value: 1,
  metadata: { endpoint: '/api/employees', method: 'GET' }
});

// Super Admin: View aggregated metrics
const metrics = await getSystemMetrics({
  metric: 'api.calls',
  period: '24h',
  groupBy: 'source'
});
// Result: { CRM: 15000, SUPER_ADMIN: 200 }
```

## Best Practices

### 1. Always Test Both Apps

When making schema changes:
- ✅ Test in CRM app first
- ✅ Then test in Super Admin app
- ✅ Verify both apps work together

### 2. Use Transactions for Multi-Table Operations

```typescript
// Super Admin: Create company with admin
await prisma.$transaction(async (tx) => {
  const company = await tx.company.create({ data: companyData });
  const admin = await tx.user.create({
    data: { ...adminData, companyId: company.id }
  });
  return { company, admin };
});
```

### 3. Document Breaking Changes

Before deploying breaking changes:
- Document in CHANGELOG
- Notify team
- Plan deployment order
- Test rollback procedure

### 4. Version API Responses

```typescript
// API response versioning
interface APIResponse {
  version: '1.0';
  data: any;
}
```

## Troubleshooting

### Schema Drift

**Symptom**: Apps work individually but integration fails

**Solution**:
```bash
# Compare schemas
diff ../CRM-repo/packages/database/prisma/schema.prisma ./prisma/schema.prisma

# If different, copy and regenerate
cp ../CRM-repo/packages/database/prisma/schema.prisma ./prisma/
npx prisma generate
```

### Stale Data

**Symptom**: Super Admin changes not visible in CRM app

**Solution**: Check caching
```typescript
// Disable Prisma query caching for testing
const company = await prisma.company.findUnique({
  where: { id: companyId },
  // Force fresh query
  revalidate: 0
});
```

### Auth Token Confusion

**Symptom**: Token rejected by CRM app

**Solution**: Verify correct JWT secret is used
```typescript
// Super Admin generates impersonation token with CRM secret
const token = jwt.sign(payload, process.env.CRM_JWT_SECRET);
// NOT: process.env.SUPER_ADMIN_JWT_SECRET
```

## Next Steps

- Review [SHARED-CONCERNS.md](./SHARED-CONCERNS.md) for coordination strategies
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment order
- Check [DATABASE-ACCESS.md](./DATABASE-ACCESS.md) for database patterns
