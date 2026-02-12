# Quick Start Guide - HRPlatform Phase 0.1

## 🚀 Get Up and Running in 5 Minutes

### Prerequisites
- Node.js 20+ installed
- Docker Desktop installed and running
- Terminal/Command Prompt

---

## Step 1: Extract the Project

```bash
# Extract the tarball
tar -xzf hrplatform-phase0-foundation.tar.gz
cd hrplatform

# Or if you cloned from git:
cd hrplatform
```

---

## Step 2: Setup Yarn 4

```bash
# Enable corepack (comes with Node.js 16+)
corepack enable

# Activate Yarn 4
corepack prepare yarn@4.1.0 --activate

# Verify installation
yarn --version
# Should show: 4.1.0
```

---

## Step 3: Install Dependencies

```bash
# Install all workspace dependencies
yarn install

# This will take a minute...
```

---

## Step 4: Setup Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Open .env.local and set these required variables:
# (Most defaults are already set for local dev!)
```

**Generate secrets** (use these commands):
```bash
# JWT Secret (32 bytes)
openssl rand -hex 32

# Encryption Key (64 bytes for AES-256)
openssl rand -hex 32

# Session Secret (32 bytes)
openssl rand -hex 32
```

Paste these into your `.env.local`:
```env
JWT_SECRET="<paste-first-key>"
ENCRYPTION_KEY="<paste-second-key><paste-second-key>"  # Concatenate twice for 64 chars
SESSION_SECRET="<paste-third-key>"
```

---

## Step 5: Start Docker Services

```bash
# Start PostgreSQL, Redis, Elasticsearch, Kibana
yarn docker:up

# Wait ~30 seconds for services to initialize
# You should see "healthy" status for all services
```

**Verify services are running**:
```bash
# Check all containers
docker ps

# You should see:
# - hrplatform-postgres (port 5432)
# - hrplatform-redis (port 6379)
# - hrplatform-elasticsearch (port 9200)
# - hrplatform-kibana (port 5601)
# - hrplatform-mailhog (ports 1025, 8025)
```

**Quick health checks**:
```bash
# PostgreSQL
docker exec hrplatform-postgres pg_isready -U hrplatform

# Elasticsearch
curl http://localhost:9200

# Kibana (open in browser)
open http://localhost:5601
```

---

## Step 6: Test the Logging System

Create a test file:

```typescript
// test-logging.ts
const { logger } = require('./packages/core/src/infrastructure/logging');

logger.info('🎉 HRPlatform started successfully!', {
  module: 'system',
  environment: process.env.NODE_ENV
});

logger.error('This is a test error (ignore it)', {
  module: 'test',
  testData: 'Sample error for testing'
});

logger.audit('Test audit entry', {
  action: 'CREATE',
  resourceType: 'TEST',
  userId: 'test-user',
  companyId: 'test-company',
  success: true
});

console.log('\n✅ Logs sent successfully!');
console.log('📁 Check logs/ directory for file logs');
console.log('🔍 Check Kibana at http://localhost:5601\n');
```

Run it:
```bash
npx ts-node test-logging.ts
```

You should see:
1. **Console output** with colored logs
2. **Files created** in `logs/` directory
3. **Logs in Kibana** (after setting up index pattern)

---

## Step 7: Setup Kibana (First Time Only)

1. **Open Kibana**: http://localhost:5601

2. **Create Index Pattern**:
   - Click "Explore on my own"
   - Go to Menu → Management → Stack Management
   - Click "Index Patterns" under Kibana
   - Click "Create index pattern"
   - Enter pattern: `hrplatform-logs-*`
   - Click "Next step"
   - Select `@timestamp` as time field
   - Click "Create index pattern"

3. **View Logs**:
   - Go to Menu → Analytics → Discover
   - You should see your test logs!
   - Try filtering:
     - `severity:error`
     - `fields.module:test`
     - `fields.userId:test-user`

---

## 🎉 Success! You're Ready to Code

### Available Services

| Service | URL | Credentials |
|---------|-----|-------------|
| **Kibana** | http://localhost:5601 | No auth (local) |
| **PostgreSQL** | localhost:5432 | user: `hrplatform`, pass: `hrplatform_dev_password` |
| **Redis** | localhost:6379 | pass: `hrplatform_redis_password` |
| **Elasticsearch** | http://localhost:9200 | No auth (local) |
| **Mailhog** | http://localhost:8025 | No auth |

### Useful Commands

```bash
# Development
yarn dev                 # Start all apps (when created)

# Docker
yarn docker:up           # Start services
yarn docker:down         # Stop services  
yarn docker:logs         # View logs
yarn docker:restart      # Restart services

# Database (when Prisma is set up)
yarn db:migrate:dev      # Create migration
yarn db:studio           # Open Prisma Studio

# Code Quality
yarn lint                # Check code
yarn format              # Format code
yarn type-check          # TypeScript check
```

### Project Structure

```
hrplatform/
├── apps/                    # Applications (to be created)
├── packages/
│   └── core/               # ✅ Core logic with logging
│       └── src/
│           ├── infrastructure/logging/  # ✅ Winston logger
│           ├── shared/types/            # ✅ TypeScript types
│           ├── domain/                  # Next: entities
│           └── application/             # Next: use cases
├── docker-compose.yml      # ✅ Local services
├── package.json            # ✅ Root package.json
├── .env.example            # ✅ Environment template
└── README.md               # ✅ Full documentation
```

---

## 📚 Next Steps

Now that you have the foundation running:

1. **Phase 0.2**: Database setup with Prisma
2. **Phase 0.3**: Error handling framework
3. **Phase 0.4**: Base architecture (repositories, use cases)
4. **Phase 1**: Authentication service

---

## 🐛 Troubleshooting

### Docker services won't start
```bash
# Check if ports are already in use
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9200  # Elasticsearch

# Stop conflicting services or change ports in docker-compose.yml
```

### Elasticsearch won't start
```bash
# Increase vm.max_map_count (Linux/Mac)
sudo sysctl -w vm.max_map_count=262144

# Or add to /etc/sysctl.conf
vm.max_map_count=262144
```

### Logs not appearing in Kibana
```bash
# Check Elasticsearch health
curl http://localhost:9200/_cluster/health

# Check if logs index exists
curl http://localhost:9200/_cat/indices?v

# Restart Kibana
docker restart hrplatform-kibana
```

### TypeScript errors
```bash
# Install dependencies again
yarn install

# Clear turbo cache
yarn clean

# Rebuild
yarn build
```

---

## ✅ Checklist

- [ ] Node.js 20+ installed
- [ ] Docker Desktop running
- [ ] Yarn 4 installed (`corepack enable`)
- [ ] Dependencies installed (`yarn install`)
- [ ] `.env.local` created with secrets
- [ ] Docker services running (`yarn docker:up`)
- [ ] Kibana accessible (http://localhost:5601)
- [ ] Index pattern created in Kibana
- [ ] Test logs visible in Kibana

---

## 🆘 Need Help?

Check these resources:
1. **SETUP-SUMMARY.md** - Detailed setup guide
2. **README.md** - Full documentation
3. **ARCHITECTURE-DIAGRAM.md** - System overview
4. Docker logs: `yarn docker:logs`

---

**You're all set! Time to build something amazing! 🚀**
