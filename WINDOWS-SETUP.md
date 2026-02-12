# Windows Setup Guide - Vercel + Supabase

## 🎯 Overview

This guide will help you set up the HRPlatform on **Windows** using:
- ✅ **Vercel** for hosting (Next.js)
- ✅ **Supabase** for PostgreSQL database
- ✅ **Structured JSON logging** (ELK-ready, but not using ELK yet)
- ✅ **Node 22.21.0** (you already have this!)
- ✅ **Yarn 4** (we'll upgrade from Yarn 1.22.22)

---

## 📋 Prerequisites Checklist

Before you start, make sure you have:

- [x] **Node.js 22.21.0** (you have this!)
- [x] **Yarn 1.22.22** (we'll upgrade to Yarn 4)
- [x] **Docker Desktop for Windows** (make sure it's running)
- [ ] **Git** installed ([Download](https://git-scm.com/download/win))
- [ ] **VS Code** (recommended) ([Download](https://code.visualstudio.com/))
- [ ] **Supabase account** (free) - we'll create this together

---

## 🚀 Step-by-Step Setup

### Step 1: Extract the Project

```powershell
# In PowerShell or Command Prompt
# Navigate to where you want the project
cd C:\Projects  # or wherever you want

# Extract the tarball (if you have tar, or use 7-Zip/WinRAR)
# Or just extract using Windows Explorer
```

If you don't have `tar` on Windows, just:
1. Right-click the `.tar.gz` file
2. Extract with 7-Zip or WinRAR
3. Or use Windows 11's built-in extraction

---

### Step 2: Upgrade to Yarn 4

**Why Yarn 4?**
- Faster than Yarn 1
- Better workspace support
- Required for Turborepo features we're using

**In PowerShell (Run as Administrator):**

```powershell
# Enable corepack (comes with Node.js 16+)
corepack enable

# Navigate to project folder
cd hrplatform

# Activate Yarn 4
corepack prepare yarn@4.1.0 --activate

# Verify installation
yarn --version
# Should show: 4.1.0
```

**If you get an error about execution policy:**
```powershell
# Run PowerShell as Administrator and run:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Then try again:
corepack enable
```

---

### Step 3: Install Dependencies

```powershell
# Still in the hrplatform folder
yarn install

# This will take 2-3 minutes
# You should see: ✓ Done in XXXs
```

---

### Step 4: Setup Supabase (FREE!)

1. **Go to Supabase**: https://supabase.com/
2. **Sign up** (free account)
3. **Create a new project**:
   - Organization: Create new (e.g., "My Company")
   - Project name: `hrplatform-dev`
   - Database password: Generate a strong password (SAVE THIS!)
   - Region: Choose closest to you
   - Click **Create new project**
   - Wait 2-3 minutes for setup

4. **Get your credentials**:
   
   Once project is ready:
   
   **A. Database Connection Strings:**
   - Go to **Project Settings** (gear icon)
   - Click **Database** in sidebar
   - Scroll to **Connection string**
   - Copy both:
     - **Transaction pooler** (for Prisma)
     - **Session pooler** (Direct URL)

   **B. API Keys:**
   - Go to **Project Settings** (gear icon)
   - Click **API** in sidebar
   - Copy:
     - **Project URL** (e.g., `https://abcd1234.supabase.co`)
     - **anon/public** key
     - **service_role** key (keep secret!)

---

### Step 5: Configure Environment Variables

```powershell
# In your project folder
# Copy the example file
copy .env.example .env.local
```

**Edit `.env.local`** in VS Code or Notepad:

```env
# Database (paste your Supabase connection strings)
DATABASE_URL="postgresql://postgres:YOUR-PASSWORD@db.YOUR-PROJECT-REF.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:YOUR-PASSWORD@db.YOUR-PROJECT-REF.supabase.co:6543/postgres?pgbouncer=true"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT-REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi... your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi... your-service-role-key"

# Generate secrets (use PowerShell)
```

**Generate secrets in PowerShell:**
```powershell
# JWT Secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key (64 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex') + require('crypto').randomBytes(32).toString('hex'))"

# Session Secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste these into your `.env.local`:
```env
JWT_SECRET="<paste-first-output>"
ENCRYPTION_KEY="<paste-second-output>"
SESSION_SECRET="<paste-third-output>"
```

---

### Step 6: Start Docker (Optional for now)

**You only need Docker for:**
- Redis (caching) - optional
- Mailhog (email testing) - optional

**To start Docker services:**

```powershell
# Make sure Docker Desktop is running first!

# Start services
yarn docker:up

# Check status
docker ps

# You should see:
# - hrplatform-redis (if you need caching)
# - hrplatform-mailhog (for email testing)
```

**If you don't need these now**, you can skip Docker entirely and start it later when needed.

---

### Step 7: Test the Logging System

Create a test file to verify everything works:

**Create `test-logging.js`** in project root:

```javascript
// test-logging.js
const { logger } = require('./packages/core/src/infrastructure/logging');

// Test basic logging
logger.info('🎉 HRPlatform started successfully!', {
  module: 'system',
  environment: process.env.NODE_ENV,
  userId: 'test-user-123',
  companyId: 'test-company-abc'
});

logger.error('This is a test error (ignore it)', {
  module: 'test',
  error: 'Sample error',
  testData: { foo: 'bar' }
});

logger.audit('Test audit entry', {
  action: 'CREATE',
  resourceType: 'TEST',
  resourceId: 'test-001',
  userId: 'admin-123',
  companyId: 'company-abc',
  success: true,
  newValues: { name: 'Test Entry' }
});

logger.performance('Test operation completed', {
  module: 'test',
  duration: 125,
  memoryUsage: 50
});

console.log('\n✅ Logs sent successfully!');
console.log('📁 Check logs\\ directory for JSON log files');
console.log('🔍 All logs are in structured JSON format (ELK-ready)\n');
```

**Run it:**
```powershell
node test-logging.js
```

**You should see:**
- ✅ Console output (colored logs)
- ✅ JSON files created in `logs\` folder
- ✅ Structured JSON format (ready for ELK)

**Check the log files:**
```powershell
# View the JSON log
type logs\combined-2025-02-12.log

# You'll see structured JSON like:
# {"timestamp":"2025-02-12 10:30:45","level":"info","message":"...","metadata":{...}}
```

---

### Step 8: View Logs (JSON Format)

Open `logs\combined-2025-02-12.log` - you'll see:

```json
{
  "timestamp": "2025-02-12 10:30:45.123",
  "level": "info",
  "message": "🎉 HRPlatform started successfully!",
  "metadata": {
    "module": "system",
    "environment": "development",
    "userId": "test-user-123",
    "companyId": "test-company-abc",
    "hostname": "YOUR-PC-NAME",
    "pid": 12345
  }
}
```

**This format is perfect for:**
- ✅ Reading by humans (pretty JSON)
- ✅ Parsing by tools (structured)
- ✅ Sending to ELK (when you're ready)
- ✅ Analyzing with scripts

**When you add ELK later**, just change in `.env.local`:
```env
LOG_TO_ELASTICSEARCH=true
ELASTICSEARCH_NODE=http://localhost:9200
```

No code changes needed! 🎉

---

## 🎯 What's Working Now

### ✅ Structured Logging System
- JSON format logs (ELK-ready)
- Multiple log levels
- PII masking
- Audit trails
- Performance monitoring
- File rotation (daily)

### ✅ Supabase Connection
- PostgreSQL database
- Authentication ready
- File storage ready
- Real-time subscriptions ready

### ✅ Development Environment
- Yarn 4 workspaces
- Turborepo for fast builds
- TypeScript configuration
- ESLint + Prettier

---

## 📊 Log Files Explained

Your `logs\` folder will have:

```
logs\
├── combined-2025-02-12.log  # All logs (JSON format)
├── error-2025-02-12.log     # Only errors (JSON format)
├── audit-2025-02-12.log     # Audit trail (7-year retention)
├── exceptions.log           # Unhandled exceptions
└── rejections.log           # Unhandled promise rejections
```

**Each log entry has:**
- `timestamp`: When it happened
- `level`: error/warn/info/debug
- `message`: What happened
- `metadata`: Context (userId, companyId, etc.)

**Perfect for:**
- Debugging issues
- Security audits
- Compliance reports
- Performance analysis
- Future ELK integration

---

## 🔧 Useful Commands (Windows)

```powershell
# Development
yarn dev                 # Start development servers

# Docker (if using)
yarn docker:up           # Start Redis + Mailhog
yarn docker:down         # Stop services
yarn docker:logs         # View logs

# Database (when Prisma is set up)
yarn db:migrate:dev      # Create migration
yarn db:studio           # Open Prisma Studio

# Code Quality
yarn lint                # Check code
yarn format              # Format code
yarn type-check          # TypeScript check

# Build
yarn build               # Build for production

# Clean
yarn clean               # Remove build artifacts
```

---

## 🐛 Common Windows Issues & Fixes

### Issue: "yarn: command not found"
```powershell
# Make sure corepack is enabled
corepack enable

# Restart your terminal
```

### Issue: Docker services won't start
```powershell
# Make sure Docker Desktop is running
# Check if ports are available:
netstat -ano | findstr :6379  # Redis
netstat -ano | findstr :1025  # Mailhog

# If ports are in use, stop the conflicting service
```

### Issue: PowerShell execution policy error
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Issue: Can't extract .tar.gz
- Download 7-Zip: https://www.7-zip.org/
- Or use Windows 11's built-in extraction
- Or use Git Bash: `tar -xzf filename.tar.gz`

### Issue: Line endings (CRLF vs LF)
```powershell
# Git will handle this automatically if configured:
git config --global core.autocrlf true
```

---

## ✅ Setup Checklist

- [ ] Node.js 22.21.0 verified
- [ ] Yarn upgraded to 4.1.0
- [ ] Dependencies installed (`yarn install`)
- [ ] Supabase project created
- [ ] `.env.local` created with credentials
- [ ] Secrets generated and added
- [ ] Test logging script runs successfully
- [ ] JSON log files created in `logs\` folder
- [ ] Docker Desktop running (if using Docker)

---

## 🎉 Success Criteria

You're ready to continue when:

1. ✅ `yarn --version` shows `4.1.0`
2. ✅ `yarn install` completes without errors
3. ✅ Test logging script runs and creates JSON logs
4. ✅ You can see structured JSON in `logs\combined-*.log`
5. ✅ Supabase project is created and credentials are in `.env.local`

---

## 📞 What's Next?

Once you confirm everything above is working, we'll move to:

**Phase 0.2: Database Schema with Prisma**
- Create database tables
- Setup multi-tenancy
- Create migrations
- Add seed data

---

## 💡 Quick Tips

- Use **VS Code** with the recommended extensions (we've configured them)
- **Git Bash** is useful for Unix commands on Windows
- Keep **Docker Desktop** running if you're using Redis/Mailhog
- Check **logs\** folder regularly during development
- **Supabase Dashboard** is your friend (use it to view database, storage, etc.)

---

**Ready? Let me know if everything is working! 🚀**
