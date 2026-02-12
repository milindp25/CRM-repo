# HRPlatform Super Admin - Platform Management Portal

> Platform-level administration interface for managing all companies, billing, subscriptions, and system-wide settings.

## Overview

The Super Admin portal is a **separate Next.js application** deployed independently from the main CRM app. It provides platform-level administrative capabilities for managing the entire HRPlatform system.

## Purpose

The Super Admin app allows platform administrators to:

### Company Management
- Create and onboard new companies/tenants
- View all companies and their statistics
- Manage company subscriptions and billing
- Suspend or activate company accounts
- Configure company-specific feature flags

### Billing & Subscriptions
- Handle subscription plans (FREE, BASIC, PREMIUM, ENTERPRISE)
- Process payments via Stripe (International) or Razorpay (India)
- Generate invoices and payment receipts
- Track payment history and failed payments
- Manage subscription upgrades/downgrades

### System Monitoring
- View system-wide analytics and KPIs
- Monitor database performance and health
- Track API usage across all companies
- View error logs and system alerts
- Monitor uptime and performance metrics

### User Support
- View all users across all companies
- Reset passwords and troubleshoot login issues
- Impersonate company admin for support (with audit trail)
- View and respond to support tickets
- Access company-specific audit logs

### Feature Management
- Enable/disable features globally or per-company
- Configure system-wide settings
- Manage API rate limits per company
- Control access to beta features

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **Language**: TypeScript 5.3+ (strict mode)
- **Database**: Supabase PostgreSQL (shared with CRM app)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Authentication**: Custom JWT (separate from CRM auth)
- **Payment**: Stripe + Razorpay
- **Deployment**: Vercel

## Key Architectural Differences from CRM App

### 1. No Multi-Tenancy Middleware
- Super Admins see data from **all companies**
- No `companyId` filtering in queries
- Bypasses Row-Level Security (RLS) using service role key

### 2. Different Authentication
- Separate JWT secrets from CRM app
- Super Admin users have `role = 'SUPER_ADMIN'` and `companyId = NULL`
- No employee record linkage (Super Admins aren't company employees)

### 3. Database Access
- Uses Supabase **service role key** (bypasses RLS)
- Direct Prisma access to all data
- Read/write permissions across all companies

### 4. Billing Integration
- Stripe integration for international payments
- Razorpay integration for Indian market
- Webhook handlers for payment events

## Repository Structure

When you create the Super Admin repository, use this structure:

```
hrplatform-super-admin/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── forgot-password/
│   ├── (dashboard)/
│   │   ├── layout.tsx           # Admin dashboard layout
│   │   ├── page.tsx             # Dashboard home
│   │   ├── companies/           # Company management
│   │   ├── billing/             # Billing & subscriptions
│   │   ├── analytics/           # System analytics
│   │   ├── users/               # User management
│   │   ├── support/             # Support tickets
│   │   └── settings/            # System settings
│   └── api/                     # API routes
│       ├── companies/
│       ├── billing/
│       ├── webhooks/            # Stripe/Razorpay webhooks
│       └── analytics/
├── components/                   # React components
│   ├── ui/                      # Shadcn UI components
│   ├── companies/
│   ├── billing/
│   └── analytics/
├── lib/                         # Utilities
│   ├── prisma.ts               # Prisma client (shared schema)
│   ├── auth.ts                 # Super Admin authentication
│   ├── stripe.ts               # Stripe client
│   └── razorpay.ts             # Razorpay client
├── prisma/                      # Database schema (copy from CRM repo)
│   └── schema.prisma           # Same schema as CRM app
├── public/                      # Static assets
├── .env.local                   # Environment variables
├── next.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## Quick Start

### Prerequisites

1. Node.js 20+ installed
2. Access to the shared Supabase database (same as CRM app)
3. Stripe and/or Razorpay API keys
4. Super Admin JWT secret (different from CRM)

### Setup Steps

See [SETUP.md](./SETUP.md) for detailed installation instructions.

Quick overview:
```bash
# 1. Clone or create the repository
git init hrplatform-super-admin
cd hrplatform-super-admin

# 2. Copy package.json template (see PACKAGE-JSON-TEMPLATE.md)

# 3. Install dependencies
npm install

# 4. Copy Prisma schema from CRM repo
# See PRISMA-SETUP.md

# 5. Setup environment variables
# See .env.example in this folder

# 6. Generate Prisma client
npx prisma generate

# 7. Start development server
npm run dev
# Runs on http://localhost:3001
```

## Documentation Index

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Detailed architecture and design patterns |
| [SETUP.md](./SETUP.md) | Step-by-step setup and installation guide |
| [.env.example](./.env.example) | Environment variables template |
| [FEATURES.md](./FEATURES.md) | Complete feature specifications |
| [DATABASE-ACCESS.md](./DATABASE-ACCESS.md) | Database access patterns and RLS bypass |
| [API-SPEC.md](./API-SPEC.md) | API endpoints and request/response formats |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment guide for Vercel |
| [INTEGRATION.md](./INTEGRATION.md) | Integration with CRM app |
| [PRISMA-SETUP.md](./PRISMA-SETUP.md) | Prisma schema setup and synchronization |
| [PACKAGE-JSON-TEMPLATE.md](./PACKAGE-JSON-TEMPLATE.md) | Starter package.json with dependencies |
| [SHARED-CONCERNS.md](./SHARED-CONCERNS.md) | Coordination with CRM repo (schemas, types) |

## Security Considerations

### 🔒 Critical Security Notes:

1. **Never commit .env.local** - Contains service role key with full database access
2. **Audit all actions** - Super Admin actions must be logged to audit trail
3. **Use HTTPS only** - Never deploy without SSL
4. **Rate limit API** - Prevent abuse of admin APIs
5. **IP whitelist** - Consider restricting Super Admin access by IP
6. **MFA recommended** - Require 2FA for Super Admin accounts
7. **Session timeout** - Short session lifetime (15-30 minutes)

## Deployment

The Super Admin app should be deployed separately from the CRM app:

- **CRM App**: `https://app.hrplatform.com` (or your domain)
- **Super Admin**: `https://admin.hrplatform.com` (or your domain)

Both apps connect to the **same Supabase database**.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Development Workflow

1. **Schema changes**: Always run migrations from the CRM repo first
2. **Update Super Admin**: Copy updated Prisma schema and regenerate client
3. **Test locally**: Ensure both apps work with schema changes
4. **Deploy CRM first**: Deploy CRM app changes
5. **Deploy Super Admin**: Then deploy Super Admin changes

See [SHARED-CONCERNS.md](./SHARED-CONCERNS.md) for coordination strategies.

## Support

For questions about setting up the Super Admin app, refer to the documentation files in this folder. All setup information needed to create the Super Admin repository is contained here.

---

**Next Steps:**
1. Read [SETUP.md](./SETUP.md) to start building the Super Admin app
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for design patterns
3. Check [DATABASE-ACCESS.md](./DATABASE-ACCESS.md) for database integration
4. Follow [DEPLOYMENT.md](./DEPLOYMENT.md) when ready to deploy
