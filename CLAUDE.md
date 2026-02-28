# CLAUDE.md — Project Context for Claude Code

## Project Overview

HRPlatform is a multi-tenant SaaS HRIS (Human Resource Information System). It has 4 apps in a monorepo managed by Yarn 4 workspaces + Turborepo.

## Architecture

| App | Framework | Port | Purpose |
|-----|-----------|------|---------|
| `apps/api` | NestJS 11 | 4000 | Tenant API (all HR operations) |
| `apps/admin-api` | NestJS 11 | 4001 | Admin API (billing, company management) |
| `apps/web` | Next.js 14 | 3000 | Tenant Portal (employee/HR/manager UI) |
| `apps/admin` | Next.js 14 | 3001 | Admin Portal (super-admin dashboard) |

**Shared packages:**
- `packages/database` — Prisma schema, migrations, seed script
- `packages/shared` — Enums, types, constants (compiled to `dist/`)

## Key Commands

```bash
# Start all apps
yarn dev

# Build shared (required before API/web can resolve new exports)
cd packages/shared && npx tsc

# Generate Prisma client
npx prisma generate --schema=packages/database/prisma/schema.prisma

# Create new migration
cd packages/database && npx prisma migrate dev --name describe_change

# Deploy migrations to any database
DATABASE_URL="..." npx prisma migrate deploy

# Seed database
cd packages/database && npx tsx src/seed.ts
```

## RBAC & Security

**5-tier roles:** SUPER_ADMIN > COMPANY_ADMIN > HR_ADMIN > MANAGER > EMPLOYEE

**Guard chain order (tenant API):** JwtAuth > Throttler > CompanyIsolation > Subscription > Feature > Roles > Permissions

**Admin API guard chain:** JwtAuth > Throttler > RolesGuard (enforces SUPER_ADMIN only)

**50+ permissions** defined in `packages/shared/src/enums/roles.enum.ts`, mapped per role in `RolePermissions`.

**Feature flags** defined in `packages/shared/src/constants/features.ts`. Tier-based (FREE/BASIC/PROFESSIONAL/ENTERPRISE) + paid add-ons via `CompanyAddon` model. FeatureGuard checks: (1) company.featuresEnabled, (2) TIER_FEATURES[tier], (3) active CompanyAddon records.

## Multi-Tenancy

Row-level isolation via `companyId` on every tenant table. Enforced by `CompanyIsolationGuard`. SUPER_ADMIN bypasses all company/subscription/feature guards.

## Encryption

AES-256-CBC encryption for PII (SSN, Aadhaar, PAN, bank details, salary) using `ENCRYPTION_KEY` env var. Implemented in `apps/api/src/modules/employee/employee.service.ts`. Fields stored as `*Encrypted` columns (e.g., `ssnEncrypted`, `basicSalaryEncrypted`).

## Database

**Provider:** PostgreSQL (Supabase, but works with any PostgreSQL/MySQL)
**ORM:** Prisma 5.x
**Schema:** `packages/database/prisma/schema.prisma` (~2300 lines, 62+ models)
**Migrations:** `packages/database/prisma/migrations/` (baseline 0_init + incremental)

## Environment Variables

```
apps/api/.env              ← DB, JWT, encryption, SMTP, OAuth
apps/admin-api/.env        ← DB, JWT (must match api)
apps/web/.env.local        ← NEXT_PUBLIC_* URLs + server-side DB/JWT
apps/admin/.env.local      ← NEXT_PUBLIC_* URLs only
packages/database/.env     ← DB URL for Prisma CLI
```

**Shared secrets (must match):** JWT_SECRET across api + admin-api + web. DATABASE_URL across all.

**SECURITY:** Never add secrets to `next.config.js env: {}` block — that exposes them to the browser. Server-side code accesses `.env.local` via `process.env` automatically.

## Enum & Constant Locations

| What | File |
|------|------|
| `SubscriptionTier`, `SubscriptionStatus`, `AddonStatus`, `BillingCycle`, `InvoiceStatus` | `packages/shared/src/enums/status.enum.ts` |
| `Feature`, `TIER_FEATURES`, `FEATURE_LABELS` | `packages/shared/src/constants/features.ts` |
| `TIER_LIMITS`, `TIER_LABELS` | `packages/shared/src/constants/subscription-limits.ts` |
| `Permission`, `RolePermissions` | `packages/shared/src/enums/roles.enum.ts` |
| All domain enums (50+) | `packages/shared/src/enums/notification.enum.ts` |

## Tenant API Modules (36)

**Core HR:** employee, department, designation, company, users, attendance, leave, payroll
**Phase 2:** notification, invitation, document, workflow
**Phase 3:** api-key, webhook, custom-field, import-export, auth (SSO/OAuth)
**Phase 4:** performance, recruitment, training, asset, expense, shift, policy
**Phase 5:** WebSocket gateway (`common/gateways/`), i18n, dark mode, calendar, org chart, help system
**Phase 6:** analytics, leave-policy, offboarding, social, survey, timesheet, contractor, geofence, dashboard
**Infrastructure:** health, audit

## Admin API Modules (4)

admin (dashboard + company management), addon (feature add-ons), billing (plans + invoices + revenue), auth (JWT validation only)

## Frontend Pages (Tenant Portal — 30+)

dashboard, employees, departments, designations, attendance, leave, payroll, performance, recruitment, training, assets, expenses, shifts, policies, analytics, surveys, timesheets, contractors, directory, social, offboarding, org-chart, profile, settings (leave-policies, delegations, api-keys, webhooks, custom-fields, sso, geofence), import-export, reports, audit-logs, users, onboarding

## Frontend Pages (Admin Portal)

dashboard, companies, features, subscription, addons, billing/plans, billing/revenue

## Known Patterns

- **TS1272 workaround:** When `isolatedModules` + `emitDecoratorMetadata` are on, types used in decorated parameter signatures must be defined locally, not imported. Define `interface JwtPayload { ... }` locally in each controller.
- **Prisma JSON fields:** Cast typed arrays to `any` when assigning to Prisma JSON input fields.
- **Null/undefined coercion:** Use `?? undefined` when Prisma returns `string | null` but TS expects `string | undefined`.
- **Dark mode:** Use semantic Tailwind tokens (`text-foreground`, `bg-card`, `border-border`) not hardcoded colors.
- **Admin API auth:** No login endpoint — admin frontend authenticates via tenant API, then uses JWT for admin-api requests.
- **Shared package:** Must run `cd packages/shared && npx tsc` before API/web can resolve new exports. Uses `dist/` for resolution.
- **Worktree gotcha:** Run `yarn install` + `npx prisma generate` in worktree for proper resolution.

## Prisma Models (62+)

**Core:** Company, User, Employee, Department, Designation, Attendance, Leave, Payroll, TaxPayment, PayrollComponent, TaxConfiguration, SalaryStructure, SalaryComponent
**Phase 2:** Notification, Invitation, Document, WorkflowTemplate, WorkflowInstance, WorkflowStep
**Phase 3:** ApiKey, WebhookEndpoint, WebhookDelivery, CustomFieldDefinition, CustomFieldValue
**Phase 4:** ReviewCycle, PerformanceReview, Goal, JobPosting, Applicant, Interview, TrainingCourse, TrainingEnrollment, Asset, AssetAssignment, ExpenseClaim, ShiftDefinition, ShiftAssignment, Policy, PolicyAcknowledgment
**Phase 6:** ApprovalDelegation, OffboardingChecklist, OffboardingProcess, OffboardingTask, LeavePolicy, LeaveBalance, LeaveBalanceLedger, Announcement, Kudos, Survey, SurveyResponse, Timesheet, TimeEntry, Project, Contractor, ContractorInvoice, GeofenceZone, DashboardConfig
**Billing:** FeatureAddon, CompanyAddon, BillingPlan, CompanyBilling, BillingInvoice
**System:** AuditLog

## Performance Notes

- Analytics repository uses fetch-once + in-memory computation pattern to avoid N+1 queries
- 35 composite indexes added for query optimization at scale
- Supabase connection pool limit ~10-15 concurrent connections — avoid heavy parallelism
- Cold API startup has ~4-5s Prisma connection warmup; subsequent calls <1s

## Deployment

**Stack:** Vercel (frontends) + Render (APIs) + Supabase (database) — $0/month free tier.

**Config files:**
- `render.yaml` — Render Blueprint (both NestJS APIs)
- `apps/web/vercel.json` — Vercel config for Tenant Portal
- `apps/admin/vercel.json` — Vercel config for Admin Portal
- `.github/workflows/ci.yml` — CI pipeline (builds all 4 apps on PR/push)
- `.github/workflows/deploy-db.yml` — Manual migration deployment
- `DEPLOYMENT.md` — Full deployment guide

**CI/CD:** Auto-deploy via Render (APIs) and Vercel (frontends) on push to main. GitHub Actions validates builds on PRs.

**Key deployment notes:**
- All localhost URLs in source use env-var-with-fallback pattern (`process.env.X || 'http://localhost:...'`)
- No hardcoded secrets in source code — all via environment variables
- `JWT_SECRET` must match across: tenant API, admin API, tenant portal
- Render free tier spins down after 15 min — ~30-60s cold start on first request

## Test Credentials

| Portal | Email | Role |
|--------|-------|------|
| Tenant | `admin@demotech.com` | COMPANY_ADMIN (ENTERPRISE tier) |
| Admin | `superadmin@hrplatform.com` | SUPER_ADMIN |

Passwords are set via environment variables `SEED_USER_PASSWORD` and `SEED_ADMIN_PASSWORD` during seeding. See `packages/database/.env`.
