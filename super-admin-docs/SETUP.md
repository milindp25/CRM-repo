# Super Admin Setup Guide

Complete step-by-step guide to set up the Super Admin application.

## Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 20+ installed
- ✅ Git installed
- ✅ Access to the Supabase database (same as CRM app)
- ✅ Stripe and/or Razorpay API keys
- ✅ Text editor (VS Code recommended)

## Step 1: Create New Repository

```bash
# Create new directory
mkdir hrplatform-super-admin
cd hrplatform-super-admin

# Initialize git
git init

# Create initial structure
mkdir -p app/(auth)/login app/(dashboard) components lib prisma public
```

## Step 2: Initialize Next.js Project

Create `package.json`:

```bash
# Copy template from PACKAGE-JSON-TEMPLATE.md in this folder
# Or use npm init

npm init -y
```

Install dependencies:

```bash
# Core dependencies
npm install next@14.1.0 react@18.2.0 react-dom@18.2.0

# Database & ORM
npm install @prisma/client@5.9.1
npm install -D prisma@5.9.1

# Supabase client
npm install @supabase/supabase-js@2.95.3

# Authentication & Security
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken

# Billing
npm install stripe@14.0.0 razorpay@2.9.0

# UI & Styling
npm install tailwindcss@3.4.1 postcss@8.4.33 autoprefixer@10.4.17
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install lucide-react class-variance-authority clsx tailwind-merge

# Forms & Validation
npm install react-hook-form@7.50.0 zod@3.22.4 @hookform/resolvers

# Date handling
npm install date-fns@3.3.1

# HTTP client
npm install axios@1.6.5

# TypeScript
npm install -D typescript@5.3.3 @types/node@20.11.19 @types/react@18.2.48 @types/react-dom@18.2.18

# Linting
npm install -D eslint@8.56.0 eslint-config-next@14.1.0
```

## Step 3: Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Step 4: Configure Next.js

Create `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    APP_NAME: process.env.APP_NAME,
    APP_VERSION: process.env.APP_VERSION,
  },
  // Server configuration
  serverRuntimeConfig: {
    // Will only be available on the server side
    superAdminJwtSecret: process.env.SUPER_ADMIN_JWT_SECRET,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  },
};

module.exports = nextConfig;
```

## Step 5: Setup Prisma

### Copy Prisma Schema from CRM Repo

```bash
# If CRM repo is at ../CRM-repo/
cp -r ../CRM-repo/packages/database/prisma ./prisma

# Verify schema file exists
ls prisma/schema.prisma
```

### Create Prisma Client

Create `lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Super Admin uses service role key (bypasses RLS)
export const prisma = globalThis.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL
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

### Generate Prisma Client

```bash
# Generate Prisma client
npx prisma generate

# Verify connection (optional)
npx prisma db pull
```

## Step 6: Setup Environment Variables

Create `.env.local`:

```bash
# Copy template
cp .env.example .env.local

# Edit with your actual values
nano .env.local  # or use your favorite editor
```

**Critical values to update:**
- `DATABASE_URL` - Copy from CRM app
- `DIRECT_URL` - Copy from CRM app
- `SUPABASE_SERVICE_ROLE_KEY` - Get from Supabase dashboard
- `SUPER_ADMIN_JWT_SECRET` - Generate new secret (different from CRM)
- `STRIPE_SECRET_KEY` - Get from Stripe dashboard
- `RAZORPAY_KEY_SECRET` - Get from Razorpay dashboard

### Generate Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 7: Create Authentication System

Create `lib/auth.ts`:

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const JWT_SECRET = process.env.SUPER_ADMIN_JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.SUPER_ADMIN_JWT_EXPIRES_IN || '30m';

export async function authenticateSuperAdmin(email: string, password: string) {
  // Find Super Admin user
  const user = await prisma.user.findFirst({
    where: {
      email,
      role: 'SUPER_ADMIN',
      isActive: true,
      companyId: null // Super Admins have no company
    }
  });

  if (!user || !user.passwordHash) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: 'SUPER_ADMIN'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return { token, user };
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
```

## Step 8: Create Basic Pages

### Login Page

Create `app/(auth)/login/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Super Admin Login</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
```

### Dashboard Page

Create `app/(dashboard)/page.tsx`:

```typescript
import { prisma } from '@/lib/prisma';

export default async function DashboardPage() {
  const stats = await getSystemStats();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Super Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Companies"
          value={stats.totalCompanies}
          subtitle={`${stats.activeCompanies} active`}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Across all companies"
        />
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          subtitle={`${stats.activeEmployees} active`}
        />
      </div>
    </div>
  );
}

async function getSystemStats() {
  const [totalCompanies, activeCompanies, totalUsers, totalEmployees, activeEmployees] =
    await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } })
    ]);

  return {
    totalCompanies,
    activeCompanies,
    totalUsers,
    totalEmployees,
    activeEmployees
  };
}

function StatCard({ title, value, subtitle }: any) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
    </div>
  );
}
```

## Step 9: Configure Tailwind CSS

Create `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Create `app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## Step 10: Create First Super Admin User

Create a script to create the first Super Admin:

Create `scripts/create-super-admin.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: tsx scripts/create-super-admin.ts <email> <password>');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const superAdmin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      permissions: ['ALL'],
      isActive: true,
      emailVerified: true,
      companyId: null,
      employeeId: null
    }
  });

  console.log('✅ Super Admin created:', superAdmin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run it:

```bash
npx tsx scripts/create-super-admin.ts admin@hrplatform.com YourSecurePassword123
```

## Step 11: Start Development Server

```bash
# Add to package.json scripts:
"dev": "next dev -p 3001"

# Start server
npm run dev
```

Visit: http://localhost:3001

## Step 12: Setup Git

Create `.gitignore`:

```
# Dependencies
node_modules/
.yarn/

# Next.js
.next/
out/

# Environment variables
.env.local
.env*.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Misc
.DS_Store
*.pem

# TypeScript
*.tsbuildinfo
```

Initialize repository:

```bash
git add .
git commit -m "Initial Super Admin setup"
```

## Verification Checklist

- [ ] Prisma client generated successfully
- [ ] Can connect to Supabase database
- [ ] Super Admin user created
- [ ] Can login to Super Admin portal
- [ ] Dashboard displays system stats
- [ ] All environment variables set

## Next Steps

1. Review [FEATURES.md](./FEATURES.md) for feature implementation
2. See [API-SPEC.md](./API-SPEC.md) for API endpoints to build
3. Check [DEPLOYMENT.md](./DEPLOYMENT.md) when ready to deploy

## Troubleshooting

### Cannot connect to database

- Verify `DIRECT_URL` is correct
- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Test connection: `npx prisma db pull`

### Prisma generate fails

- Ensure `prisma/schema.prisma` exists
- Run `npm install @prisma/client prisma`
- Try `npx prisma generate --schema=./prisma/schema.prisma`

### Login fails

- Verify Super Admin user exists in database
- Check password hashing is correct
- Verify `SUPER_ADMIN_JWT_SECRET` is set

## Support

Refer to other documentation files in this folder for detailed guides on specific aspects of the Super Admin application.
