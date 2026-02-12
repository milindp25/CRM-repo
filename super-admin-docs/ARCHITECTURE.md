# Super Admin Architecture

## System Overview

The Super Admin application is a separate Next.js application that shares the same database as the CRM app but has elevated privileges to manage all companies, users, and system-wide settings.

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN APP                          │
│                (admin.hrplatform.com)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Next.js 14   │  │   Billing    │  │  Analytics   │    │
│  │  Frontend    │  │ Stripe/Razorpay │  │   Dashboard  │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │             │
│         └────────────────┬┴────────────────┘             │
│                          │                                │
│                   ┌──────▼──────┐                         │
│                   │  API Routes  │                         │
│                   │  (Admin Only)│                         │
│                   └──────┬───────┘                         │
└──────────────────────────┼──────────────────────────────────┘
                           │
                ┌──────────▼──────────┐
                │   Prisma Client     │
                │ (Service Role Key)  │
                │  Bypasses RLS       │
                └──────────┬──────────┘
                           │
         ┌─────────────────▼─────────────────┐
         │   Supabase PostgreSQL Database    │
         │       (Shared with CRM App)       │
         └───────────────────────────────────┘
                           │
         ┌─────────────────▼─────────────────┐
         │         CRM APP                   │
         │    (app.hrplatform.com)           │
         │   Prisma with RLS Filtering       │
         └───────────────────────────────────┘
```

## Application Structure

### Frontend Architecture (Next.js App Router)

```
app/
├── (auth)/                    # Authentication routes (public)
│   ├── login/
│   │   └── page.tsx          # Super Admin login
│   ├── register/             # First-time Super Admin setup
│   │   └── page.tsx
│   └── forgot-password/
│       └── page.tsx
│
├── (dashboard)/               # Protected admin dashboard
│   ├── layout.tsx            # Dashboard shell with sidebar
│   ├── page.tsx              # Dashboard home
│   │
│   ├── companies/            # Company Management
│   │   ├── page.tsx          # List all companies
│   │   ├── [id]/
│   │   │   ├── page.tsx      # Company details
│   │   │   ├── edit/
│   │   │   ├── users/        # Company users
│   │   │   ├── stats/        # Company analytics
│   │   │   └── audit/        # Company audit log
│   │   └── new/
│   │       └── page.tsx      # Create new company
│   │
│   ├── billing/              # Billing Management
│   │   ├── page.tsx          # Billing overview
│   │   ├── subscriptions/    # Active subscriptions
│   │   ├── invoices/         # Invoice history
│   │   └── payments/         # Payment transactions
│   │
│   ├── analytics/            # System Analytics
│   │   ├── page.tsx          # Analytics dashboard
│   │   ├── revenue/          # Revenue analytics
│   │   ├── usage/            # System usage stats
│   │   └── performance/      # Performance metrics
│   │
│   ├── users/                # User Management (all companies)
│   │   ├── page.tsx          # All users
│   │   └── [id]/
│   │       ├── page.tsx      # User details
│   │       └── impersonate/  # Impersonate for support
│   │
│   ├── support/              # Support Management
│   │   ├── page.tsx          # Support tickets
│   │   └── [id]/
│   │       └── page.tsx      # Ticket details
│   │
│   └── settings/             # System Settings
│       ├── page.tsx          # General settings
│       ├── features/         # Feature flags
│       ├── email/            # Email templates
│       └── api/              # API configuration
│
└── api/                      # API Routes
    ├── companies/
    │   ├── route.ts          # GET all, POST create
    │   └── [id]/
    │       ├── route.ts      # GET, PATCH, DELETE
    │       └── stats/
    │           └── route.ts  # GET company stats
    │
    ├── billing/
    │   ├── subscriptions/
    │   │   └── route.ts      # Subscription management
    │   └── invoices/
    │       └── route.ts      # Invoice generation
    │
    ├── webhooks/
    │   ├── stripe/
    │   │   └── route.ts      # Stripe webhook handler
    │   └── razorpay/
    │       └── route.ts      # Razorpay webhook handler
    │
    ├── analytics/
    │   ├── dashboard/
    │   │   └── route.ts      # Dashboard metrics
    │   └── revenue/
    │       └── route.ts      # Revenue analytics
    │
    └── users/
        ├── route.ts          # User management
        └── [id]/
            └── impersonate/
                └── route.ts  # Impersonation API
```

## Authentication Flow

### Super Admin Authentication

```typescript
// lib/auth.ts - Super Admin specific auth

export async function authenticateSuperAdmin(email: string, password: string) {
  // 1. Query User table with role = 'SUPER_ADMIN'
  const user = await prisma.user.findFirst({
    where: {
      email,
      role: 'SUPER_ADMIN',
      isActive: true,
      companyId: null // Super Admins have no company
    }
  });

  if (!user) throw new Error('Super Admin not found');

  // 2. Verify password
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');

  // 3. Generate JWT with Super Admin secret
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: 'SUPER_ADMIN'
    },
    process.env.SUPER_ADMIN_JWT_SECRET!,
    { expiresIn: '30m' } // Short session for security
  );

  // 4. Log authentication to audit trail
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN',
      resourceType: 'SUPER_ADMIN_AUTH',
      ipAddress: getClientIp(),
      success: true
    }
  });

  return { token, user };
}
```

### Middleware Protection

```typescript
// middleware.ts

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public routes
  if (path.startsWith('/login')) {
    return NextResponse.next();
  }

  // Protected routes - verify Super Admin token
  const token = request.cookies.get('super_admin_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const decoded = jwt.verify(token, process.env.SUPER_ADMIN_JWT_SECRET!);

    // Verify role is SUPER_ADMIN
    if (decoded.role !== 'SUPER_ADMIN') {
      throw new Error('Insufficient permissions');
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!api/webhooks|_next/static|_next/image|favicon.ico|login).*)',
  ],
};
```

## Database Access Patterns

### Using Service Role Key

```typescript
// lib/prisma.ts

import { PrismaClient } from '@prisma/client';

// Super Admin uses SERVICE_ROLE_KEY which bypasses RLS
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL // Service role connection
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Example: Query all companies (bypasses RLS)
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

// Example: Get cross-company analytics
export async function getSystemAnalytics() {
  const [totalCompanies, activeCompanies, totalEmployees] = await Promise.all([
    prisma.company.count(),
    prisma.company.count({ where: { isActive: true } }),
    prisma.employee.count({ where: { status: 'ACTIVE' } })
  ]);

  return { totalCompanies, activeCompanies, totalEmployees };
}
```

### Key Differences from CRM App

| Aspect | CRM App | Super Admin App |
|--------|---------|-----------------|
| Database Access | Filtered by `companyId` via RLS | Full access, bypasses RLS |
| Prisma Connection | `DATABASE_URL` (pooled) | `DIRECT_URL` + service role |
| User Context | `companyId` from session | No `companyId`, role = SUPER_ADMIN |
| Authentication | Company-specific JWT | Separate Super Admin JWT |
| Session Duration | 7 days | 30 minutes (security) |

## Billing Integration

### Stripe Integration

```typescript
// lib/stripe.ts

import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// Create subscription for a company
export async function createSubscription(
  companyId: string,
  priceId: string,
  customerId: string
) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata: {
      companyId
    }
  });

  // Update company record
  await prisma.company.update({
    where: { id: companyId },
    data: {
      subscriptionTier: getTierFromPriceId(priceId),
      subscriptionStatus: 'ACTIVE'
    }
  });

  return subscription;
}
```

### Webhook Handling

```typescript
// app/api/webhooks/stripe/route.ts

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle different event types
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionCancellation(event.data.object);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSuccess(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
  }

  return Response.json({ received: true });
}
```

## Security Architecture

### Audit Logging

Every Super Admin action must be logged:

```typescript
// lib/audit.ts

export async function logAdminAction(
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  changes: any,
  request: Request
) {
  await prisma.auditLog.create({
    data: {
      userId,
      userEmail: await getUserEmail(userId),
      action,
      resourceType,
      resourceId,
      oldValues: changes.old,
      newValues: changes.new,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
      success: true,
      companyId: null // Super Admin actions are platform-level
    }
  });
}
```

### Rate Limiting

```typescript
// lib/rate-limit.ts

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!
});

export const adminRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
  analytics: true
});

// Apply to API routes
export async function checkRateLimit(identifier: string) {
  const { success, reset } = await adminRateLimit.limit(identifier);

  if (!success) {
    throw new Error(`Rate limit exceeded. Reset at ${new Date(reset)}`);
  }
}
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│              Vercel Edge Network                │
├─────────────────────────────────────────────────┤
│                                                 │
│  admin.hrplatform.com                          │
│         ↓                                       │
│  ┌──────────────────┐                          │
│  │  Super Admin App │                          │
│  │   (Next.js)      │                          │
│  └────────┬─────────┘                          │
│           │                                     │
│           ↓                                     │
│  ┌────────────────────┐                        │
│  │  Supabase Database │                        │
│  │   (PostgreSQL)     │ ← Shared              │
│  └────────┬───────────┘                        │
│           ↑                                     │
│           │                                     │
│  ┌────────┴─────────┐                          │
│  │     CRM App      │                          │
│  │   (Next.js)      │                          │
│  └──────────────────┘                          │
│         ↑                                       │
│  app.hrplatform.com                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Performance Considerations

1. **Caching**: Use Redis for caching frequently accessed data
2. **Pagination**: Always paginate company/user lists
3. **Lazy Loading**: Load analytics data on-demand
4. **Incremental Static Regeneration**: Use ISR for dashboard pages
5. **Database Indexes**: Ensure proper indexes on frequently queried fields

## Next Steps

- Review [DATABASE-ACCESS.md](./DATABASE-ACCESS.md) for detailed database patterns
- See [API-SPEC.md](./API-SPEC.md) for complete API documentation
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment guidelines
