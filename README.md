# HRPlatform

Enterprise-grade Human Resource Management Platform — multi-tenant SaaS with full HRIS capabilities.

## Architecture

```
hrplatform/
├── apps/
│   ├── api/           # Tenant API    (NestJS 11, port 4000)
│   ├── admin-api/     # Admin API     (NestJS 11, port 4001)
│   ├── web/           # Tenant Portal (Next.js 14, port 3000)
│   └── admin/         # Admin Portal  (Next.js 14, port 3001)
├── packages/
│   ├── database/      # Prisma schema, migrations, seed
│   └── shared/        # Enums, types, constants (compiled to dist/)
├── .env.example       # Environment variable reference guide
└── turbo.json         # Turborepo pipeline config
```

**Tech Stack:** TypeScript, PostgreSQL (Supabase/AWS RDS/any), Prisma ORM, Yarn 4 workspaces, Turborepo

## Prerequisites

- **Node.js** 20+ — [Download](https://nodejs.org/)
- **Yarn 4** — Enabled via corepack (see below)
- **PostgreSQL** — Supabase, AWS RDS, local Docker, or any PostgreSQL instance
- **Git**

## Setup (First Time)

### 1. Clone and install

```bash
git clone https://github.com/yourusername/hrplatform.git
cd hrplatform

# Enable Yarn 4
corepack enable
corepack prepare yarn@4.1.0 --activate

# Install all dependencies
yarn install
```

### 2. Configure environment variables

Each app has its own `.env` file. Copy the templates and fill in your values:

```bash
# Backend APIs
cp apps/api/.env.example apps/api/.env
cp apps/admin-api/.env.example apps/admin-api/.env

# Frontend apps
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local

# Database package (for Prisma CLI)
cp packages/database/.env.example packages/database/.env
```

**Generate secrets:**

```bash
# JWT Secret (use the same value in api, admin-api, and web)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key (api only — encrypts employee PII)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT Refresh Secret (api only)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Secret locations:**

| Secret | Where to set | Notes |
|--------|-------------|-------|
| `DATABASE_URL` | api, admin-api, web, packages/database | Same DB for all |
| `JWT_SECRET` | api, admin-api, web | **Must match** across all three |
| `ENCRYPTION_KEY` | api only | AES-256 key for PII encryption |
| `JWT_REFRESH_SECRET` | api only | Refresh token signing |
| `SMTP_*` | api only (optional) | Email notifications |
| `GOOGLE_CLIENT_*` | api only (optional) | Google SSO |

### 3. Set up the database

```bash
# Generate Prisma client
npx prisma generate --schema=packages/database/prisma/schema.prisma

# Run migrations (applies all pending migrations)
cd packages/database
npx prisma migrate deploy

# Seed with demo data (optional)
npx tsx src/seed.ts
cd ../..
```

### 4. Build shared packages

```bash
# Shared package must be compiled before APIs/frontends can import it
cd packages/shared && npx tsc && cd ../..
```

### 5. Start all apps

```bash
# Start everything (all 4 apps in parallel via Turborepo)
yarn dev
```

Or start individually:

```bash
# Tenant API (port 4000)
cd apps/api && yarn start:dev

# Admin API (port 4001)
cd apps/admin-api && yarn start:dev

# Tenant Portal (port 3000)
cd apps/web && yarn dev

# Admin Portal (port 3001)
cd apps/admin && yarn dev
```

### 6. Verify

| App | URL | Credentials |
|-----|-----|-------------|
| Tenant Portal | http://localhost:3000 | `admin@demotech.com` / (set via `SEED_USER_PASSWORD` env) |
| Admin Portal | http://localhost:3001 | `superadmin@hrplatform.com` / (set via `SEED_ADMIN_PASSWORD` env) |
| Tenant API Health | http://localhost:4000/v1/health | — |
| Admin API Health | http://localhost:4001/v1/health | — |
| API Docs (Swagger) | http://localhost:4000/api-docs | — |

## Database Migrations

This project uses **Prisma Migrate** for schema management (not `db push`).

### Creating a new migration

```bash
cd packages/database

# 1. Edit schema.prisma with your changes

# 2. Generate migration SQL + apply to dev database
npx prisma migrate dev --name describe_your_change

# 3. Regenerate Prisma client
npx prisma generate
```

### Deploying migrations to another database

```bash
# Apply all pending migrations to a target database
DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
npx prisma migrate deploy
```

### Multi-database deployment (per-tenant databases)

```bash
# Deploy migrations to multiple tenant databases
for db_url in "$TENANT_DB_1" "$TENANT_DB_2" "$TENANT_DB_3"; do
  echo "Migrating: $db_url"
  DATABASE_URL="$db_url" npx prisma migrate deploy
done
```

### Switching database providers

The codebase supports any SQL database via Prisma:

| Database | Provider | Connection String Format |
|----------|----------|-------------------------|
| PostgreSQL (Supabase) | `postgresql` | `postgresql://user:pass@host:5432/db` |
| PostgreSQL (AWS RDS) | `postgresql` | `postgresql://user:pass@rds-endpoint:5432/db` |
| MySQL (RDS/PlanetScale) | `mysql` | `mysql://user:pass@host:3306/db` |
| Azure SQL | `sqlserver` | `sqlserver://host:1433;database=db;user=sa;password=pass` |

To switch providers, change `provider` in `packages/database/prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "mysql"  // or "postgresql", "sqlserver", "cockroachdb"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Other database commands

```bash
yarn db:studio          # Open Prisma Studio (visual DB editor)
yarn db:seed            # Run seed script
yarn db:reset           # Reset DB + re-run all migrations + seed
yarn db:migrate         # Apply pending migrations (production)
yarn db:migrate:dev     # Create + apply migration (development)
```

## Available Scripts

### Root (Turborepo)

| Command | Description |
|---------|-------------|
| `yarn dev` | Start all 4 apps in dev mode |
| `yarn build` | Build all apps for production |
| `yarn type-check` | TypeScript checking across all packages |
| `yarn lint` | ESLint across all packages |
| `yarn format` | Prettier formatting |
| `yarn test` | Run all tests |

### Database

| Command | Description |
|---------|-------------|
| `yarn db:migrate:dev` | Create + apply migration (development) |
| `yarn db:migrate` | Apply pending migrations (production) |
| `yarn db:studio` | Open Prisma Studio GUI |
| `yarn db:seed` | Seed database with demo data |
| `yarn db:reset` | Reset database (destructive!) |

## Project Structure

### Tenant API (`apps/api`) — 36 modules

Core HR, attendance, leave, payroll, performance, recruitment, training, assets, expenses, shifts, policies, analytics, surveys, timesheets, contractors, geofencing, offboarding, social directory, workflows, notifications, documents, API keys, webhooks, custom fields, import/export, and more.

### Admin API (`apps/admin-api`) — 4 modules

Company management, feature add-ons, billing/invoicing, revenue dashboard.

### Security

- **RBAC**: 5-tier roles (SUPER_ADMIN > COMPANY_ADMIN > HR_ADMIN > MANAGER > EMPLOYEE)
- **Permissions**: 50+ granular permissions
- **Guard chain**: JWT > Throttler > CompanyIsolation > Subscription > Feature > Roles > Permissions
- **Encryption**: AES-256-CBC for PII (SSN, Aadhaar, bank details, salary)
- **Multi-tenancy**: Row-level isolation via companyId
- **Feature flags**: Tier-based (FREE/BASIC/PROFESSIONAL/ENTERPRISE) + paid add-ons

### Frontend Features

Dark mode, i18n (English/Spanish), real-time WebSocket notifications, org chart, activity feed, calendar widget, help panel, configurable dashboards.

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full deployment guide.

**TL;DR:** Vercel (frontends) + Render (APIs) + Supabase (database) — **$0/month on free tier**.

```
Supabase (PostgreSQL)  ←── Render (Tenant API + Admin API)  ←── Vercel (Web + Admin)
```

**Quick deploy:**
1. Set up Supabase DB and run migrations
2. Deploy APIs via Render Blueprint (`render.yaml`)
3. Deploy frontends via Vercel (root dirs: `apps/web`, `apps/admin`)
4. Set environment variables in each platform's dashboard
5. Set up GitHub Secrets for CI/CD workflows

**CI/CD:** GitHub Actions runs on every PR — builds all 4 apps, validates Prisma schema. See `.github/workflows/`.

## Environment Variable Reference

See `.env.example` in each app directory for full documentation. Quick reference:

```
apps/api/.env              ← All backend secrets (DB, JWT, encryption, SMTP)
apps/admin-api/.env        ← DB + JWT (must match api)
apps/web/.env.local        ← Public URLs + server-side DB/JWT
apps/admin/.env.local      ← Public URLs only (no secrets needed)
packages/database/.env     ← DB URL for Prisma CLI
```

## License

MIT
