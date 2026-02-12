# Package.json Template

Complete `package.json` template for the Super Admin application.

## Full Template

```json
{
  "name": "hrplatform-super-admin",
  "version": "0.1.0",
  "private": true,
  "description": "HRPlatform Super Admin - Platform Management Portal for managing all companies, billing, and system-wide settings",
  "author": "Your Name",
  "license": "MIT",
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "postinstall": "prisma generate",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@prisma/client": "^5.9.1",
    "@supabase/supabase-js": "^2.95.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "stripe": "^14.0.0",
    "razorpay": "^2.9.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-toast": "^1.1.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.314.0",
    "react-hook-form": "^7.50.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.4",
    "date-fns": "^3.3.1",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.11.19",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "prisma": "^5.9.1",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.33",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.1.0",
    "prettier": "^3.2.5",
    "tsx": "^4.7.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

## Minimal Template (Quick Start)

If you want to start minimal and add dependencies as needed:

```json
{
  "name": "hrplatform-super-admin",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@prisma/client": "^5.9.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.11.19",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "prisma": "^5.9.1",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.1.0"
  }
}
```

Then add dependencies as you build features:

```bash
# Add UI library
npm install tailwindcss postcss autoprefixer
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# Add billing
npm install stripe razorpay

# Add forms
npm install react-hook-form zod @hookform/resolvers

# Add utilities
npm install date-fns axios clsx tailwind-merge
```

## Installation

### Fresh Installation

```bash
# Create package.json with minimal template
cat > package.json << 'EOF'
[paste minimal template here]
EOF

# Install dependencies
npm install

# Or use pnpm/yarn
pnpm install
yarn install
```

### From Existing Next.js

```bash
# If you started with create-next-app
npx create-next-app@latest hrplatform-super-admin --typescript --tailwind --app

# Then add additional dependencies
npm install @prisma/client prisma bcryptjs jsonwebtoken stripe razorpay
npm install -D @types/bcryptjs @types/jsonwebtoken
```

## Important Scripts

### Development

```bash
# Start development server on port 3001
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

### Type Checking

```bash
# Check TypeScript types
npm run type-check
```

### Linting & Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

### Database

```bash
# Open Prisma Studio
npm run db:studio

# Generate Prisma client
npm run db:generate
```

## Dependency Notes

### Core Dependencies

- **next**: Next.js 14 with App Router
- **react** & **react-dom**: React 18
- **@prisma/client**: Database ORM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **stripe**: Stripe payment integration
- **razorpay**: Razorpay payment integration (India)

### UI Dependencies

- **@radix-ui/**: Headless UI components (accessible)
- **lucide-react**: Icon library
- **tailwindcss**: Utility-first CSS
- **class-variance-authority**, **clsx**, **tailwind-merge**: CSS utilities

### Form Dependencies

- **react-hook-form**: Form state management
- **zod**: Schema validation
- **@hookform/resolvers**: Connect Zod to React Hook Form

### Utility Dependencies

- **date-fns**: Date formatting and manipulation
- **axios**: HTTP client for API calls

### Dev Dependencies

- **typescript**: TypeScript compiler
- **@types/**: TypeScript type definitions
- **prisma**: Prisma CLI
- **eslint**: Linting
- **prettier**: Code formatting
- **tsx**: TypeScript execution for scripts

## Version Management

### Update Dependencies

```bash
# Check for outdated packages
npm outdated

# Update all to latest within semver range
npm update

# Update specific package to latest
npm install next@latest
```

### Lock Versions for Production

For production stability, consider using exact versions:

```json
{
  "dependencies": {
    "next": "14.1.0",  // No ^ or ~
    "react": "18.2.0"
  }
}
```

## Optional Dependencies

### Error Tracking

```bash
npm install @sentry/nextjs
```

### Analytics

```bash
npm install @vercel/analytics
```

### Email

```bash
npm install nodemailer resend
npm install -D @types/nodemailer
```

### Redis (for caching/rate limiting)

```bash
npm install @upstash/redis @upstash/ratelimit
```

### Testing

```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @types/jest ts-jest
```

## Package Manager Choice

### npm (default)

```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

### pnpm (faster, disk-efficient)

```json
{
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0"
}
```

### Yarn (stable)

```json
{
  "engines": {
    "node": ">=20.0.0",
    "yarn": ">=4.0.0"
  },
  "packageManager": "yarn@4.1.0"
}
```

## Next Steps

1. Copy this template to your new Super Admin repository
2. Run `npm install` to install dependencies
3. Follow [SETUP.md](./SETUP.md) for complete setup
4. See [PRISMA-SETUP.md](./PRISMA-SETUP.md) for database configuration
