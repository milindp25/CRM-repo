# Deployment Guide

> **Stack:** Vercel (frontends) + Render (APIs) + Supabase (database) — **$0/month on free tier**

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────┐
│   Vercel         │     │   Render          │     │   Supabase     │
│                  │     │                   │     │                │
│  Tenant Portal   │────▶│  Tenant API       │────▶│  PostgreSQL    │
│  (Next.js:3000)  │     │  (NestJS:4000)    │     │  (free tier)   │
│                  │     │                   │     │                │
│  Admin Portal    │────▶│  Admin API        │     │                │
│  (Next.js:3001)  │     │  (NestJS:4001)    │     │                │
└─────────────────┘     └──────────────────┘     └────────────────┘
```

## Free Tier Limits

| Service   | Free Tier Limits                                       |
|-----------|-------------------------------------------------------|
| Supabase  | 500 MB database, 1 GB transfer, 50k monthly requests |
| Render    | 750 hours/month per service, spins down after 15 min  |
| Vercel    | 100 GB bandwidth, 6000 build minutes/month            |

> **Note:** Render free tier services spin down after 15 minutes of inactivity. First request after spin-down takes ~30-60 seconds (cold start).

---

## Step 1: Supabase (Database)

You likely already have this set up. If not:

1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your connection strings from **Settings → Database**:
   - `DATABASE_URL` — Pooled connection (Transaction mode, port 6543)
   - `DIRECT_URL` — Direct connection (Session mode, port 5432)

### Run Migrations

```bash
# From repo root (locally)
DATABASE_URL="postgresql://..." DIRECT_URL="postgresql://..." \
  npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

# Or use GitHub Actions (see "Deploy Migrations" workflow)
```

---

## Step 2: Render (NestJS APIs)

### Option A: Blueprint (Recommended)

1. Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
2. Click **New Blueprint Instance**
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` and creates both services
5. Set environment variables in each service's dashboard (see table below)

### Option B: Manual Setup

For each API (`hrplatform-api` and `hrplatform-admin-api`):

1. Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:

| Setting        | Tenant API                          | Admin API                            |
|----------------|-------------------------------------|--------------------------------------|
| Name           | `hrplatform-api`                    | `hrplatform-admin-api`               |
| Runtime        | Node                                | Node                                 |
| Build Command  | See below                           | See below                            |
| Start Command  | `cd apps/api && node dist/main`     | `cd apps/admin-api && node dist/main`|
| Plan           | Free                                | Free                                 |
| Health Check   | `/v1/health`                        | `/v1/health`                         |

**Tenant API Build Command:**
```
yarn install && cd packages/shared && npx tsc && cd ../.. && npx prisma generate --schema=packages/database/prisma/schema.prisma && cd apps/api && npx nest build
```

**Admin API Build Command:**
```
yarn install && cd packages/shared && npx tsc && cd ../.. && npx prisma generate --schema=packages/database/prisma/schema.prisma && cd apps/admin-api && npx nest build
```

### Render Environment Variables

#### Tenant API (`hrplatform-api`)

| Variable              | Required | Example                                           |
|-----------------------|----------|---------------------------------------------------|
| `NODE_ENV`            | Yes      | `production`                                      |
| `API_PORT`            | Yes      | `4000`                                            |
| `DATABASE_URL`        | Yes      | `postgresql://...@db.xxx.supabase.co:6543/...`    |
| `DIRECT_URL`          | Yes      | `postgresql://...@db.xxx.supabase.co:5432/...`    |
| `JWT_SECRET`          | Yes      | `<64-char hex>` ← generate with command below     |
| `JWT_REFRESH_SECRET`  | Yes      | `<64-char hex>` ← different from JWT_SECRET       |
| `ENCRYPTION_KEY`      | Yes      | `<32-char string>` for AES-256 PII encryption     |
| `ALLOWED_ORIGINS`     | Yes      | `https://your-web.vercel.app`                     |
| `FRONTEND_URL`        | Yes      | `https://your-web.vercel.app`                     |
| `GOOGLE_CLIENT_ID`    | No       | Only if using Google SSO                          |
| `GOOGLE_CLIENT_SECRET`| No       | Only if using Google SSO                          |
| `GOOGLE_CALLBACK_URL` | No       | `https://hrplatform-api.onrender.com/api/v1/auth/google/callback` |
| `SMTP_HOST`           | No       | `smtp.gmail.com` (for email notifications)        |
| `SMTP_PORT`           | No       | `587`                                             |
| `SMTP_USER`           | No       | Your email                                        |
| `SMTP_PASS`           | No       | App password (not your login password)            |
| `SMTP_FROM`           | No       | `"HRPlatform" <noreply@yourdomain.com>`           |

#### Admin API (`hrplatform-admin-api`)

| Variable                | Required | Example                                        |
|-------------------------|----------|------------------------------------------------|
| `NODE_ENV`              | Yes      | `production`                                   |
| `ADMIN_API_PORT`        | Yes      | `4001`                                         |
| `DATABASE_URL`          | Yes      | Same as Tenant API                             |
| `DIRECT_URL`            | Yes      | Same as Tenant API                             |
| `JWT_SECRET`            | Yes      | **Must match** Tenant API's JWT_SECRET         |
| `ADMIN_ALLOWED_ORIGINS` | Yes      | `https://your-admin.vercel.app`                |

### Generate Secrets

```bash
# Generate a 64-character hex secret (for JWT_SECRET, JWT_REFRESH_SECRET)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate a 32-character encryption key (for ENCRYPTION_KEY)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## Step 3: Vercel (Next.js Frontends)

### Tenant Portal (`apps/web`)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Configure:
   - **Root Directory:** `apps/web`
   - **Framework:** Next.js (auto-detected)
   - Install & build commands auto-detected from `vercel.json`

4. Set environment variables:

| Variable              | Value                                       |
|-----------------------|---------------------------------------------|
| `NEXT_PUBLIC_API_URL` | `https://hrplatform-api.onrender.com/v1`    |
| `NEXT_PUBLIC_APP_URL` | `https://your-web.vercel.app`               |
| `NEXT_PUBLIC_WS_URL`  | `https://hrplatform-api.onrender.com`       |
| `DATABASE_URL`        | Same Supabase pooled URL                    |
| `DIRECT_URL`          | Same Supabase direct URL                    |
| `JWT_SECRET`          | **Must match** API's JWT_SECRET             |

### Admin Portal (`apps/admin`)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the **same** GitHub repo (Vercel supports multiple projects per repo)
3. Configure:
   - **Root Directory:** `apps/admin`
   - **Framework:** Next.js (auto-detected)

4. Set environment variables:

| Variable                   | Value                                            |
|----------------------------|--------------------------------------------------|
| `NEXT_PUBLIC_API_URL`      | `https://hrplatform-api.onrender.com/v1`         |
| `NEXT_PUBLIC_ADMIN_API_URL`| `https://hrplatform-admin-api.onrender.com/v1`   |
| `NEXT_PUBLIC_APP_URL`      | `https://your-admin.vercel.app`                  |

---

## Step 4: GitHub Secrets (for CI/CD)

Go to your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Required Secrets

| Secret Name          | Used By         | Description                               |
|----------------------|-----------------|-------------------------------------------|
| `DATABASE_URL`       | CI, Migrations  | Supabase pooled connection string         |
| `DIRECT_URL`         | CI, Migrations  | Supabase direct connection string         |
| `SHADOW_DATABASE_URL`| CI (optional)   | Separate DB for migration drift detection |

> **Note:** Render and Vercel manage their own environment variables through their dashboards. GitHub Secrets are only needed for CI workflows and the manual migration workflow.

### Setting Up Secrets

```bash
# If you have GitHub CLI (gh) installed:
gh secret set DATABASE_URL --body "postgresql://postgres.xxx:password@db.xxx.supabase.co:6543/postgres?pgbouncer=true"
gh secret set DIRECT_URL --body "postgresql://postgres.xxx:password@db.xxx.supabase.co:5432/postgres"
```

Or via the GitHub web UI:
1. Go to `https://github.com/<owner>/<repo>/settings/secrets/actions`
2. Click **New repository secret**
3. Add each secret

---

## Step 5: Configure CORS & URLs

After deploying, update these environment variables with your actual URLs:

### Render (Tenant API)
```
ALLOWED_ORIGINS=https://your-web.vercel.app,https://your-admin.vercel.app
FRONTEND_URL=https://your-web.vercel.app
```

### Render (Admin API)
```
ADMIN_ALLOWED_ORIGINS=https://your-admin.vercel.app
```

### Vercel (Tenant Portal)
```
NEXT_PUBLIC_API_URL=https://hrplatform-api.onrender.com/v1
NEXT_PUBLIC_WS_URL=https://hrplatform-api.onrender.com
```

### Vercel (Admin Portal)
```
NEXT_PUBLIC_API_URL=https://hrplatform-api.onrender.com/v1
NEXT_PUBLIC_ADMIN_API_URL=https://hrplatform-admin-api.onrender.com/v1
```

---

## CI/CD Workflows

### Automatic (on push/PR)

The **CI** workflow (`.github/workflows/ci.yml`) runs automatically:
- Builds shared packages
- Generates Prisma client
- Builds all 4 apps in parallel
- Validates Prisma schema

### Manual (database migrations)

The **Deploy Migrations** workflow (`.github/workflows/deploy-db.yml`):
1. Go to **Actions** → **Deploy Migrations**
2. Click **Run workflow**
3. Select environment (production/staging)
4. Workflow runs `prisma migrate deploy`

### Auto-Deploy on Push

- **Render:** Auto-deploys when you push to `main` (configured in Render dashboard)
- **Vercel:** Auto-deploys when you push to `main` (configured by default)

---

## Deployment Checklist

- [ ] Supabase project created with connection strings
- [ ] Database migrations applied (`prisma migrate deploy`)
- [ ] Database seeded (`npx tsx packages/database/src/seed.ts`)
- [ ] Render: Both API services created and env vars set
- [ ] Render: Health checks passing (`/v1/health`)
- [ ] Vercel: Both frontend projects created with correct root directories
- [ ] Vercel: Environment variables set with Render API URLs
- [ ] CORS configured: API `ALLOWED_ORIGINS` includes Vercel URLs
- [ ] `JWT_SECRET` matches across: Tenant API, Admin API, Tenant Portal
- [ ] GitHub Secrets set for CI workflows
- [ ] CI pipeline passes on push to main

---

## Troubleshooting

### Render: Build fails with "command not found: nest"
Ensure the build command includes `yarn install` before `npx nest build`.

### Render: API returns 502 after deploy
Check that `API_PORT` / `ADMIN_API_PORT` env vars are set. Render needs the app to listen on the correct port.

### Vercel: Build fails with "Cannot find module '@hrplatform/shared'"
Ensure `vercel.json` is in the app directory and the build command includes building the shared package first.

### Vercel: "prisma generate" fails
Make sure `DATABASE_URL` is set in Vercel environment variables (needed for Prisma client generation at build time).

### Cold starts on Render free tier
First request after 15 min of inactivity takes 30-60 seconds. This is normal for free tier. Consider upgrading to Starter ($7/month) for always-on services.

### WebSocket connection fails
Render free tier supports WebSockets. Ensure `NEXT_PUBLIC_WS_URL` points to your Render tenant API URL (without `/v1`).
