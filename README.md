# HRPlatform CRM - Company Portal

> Enterprise-grade Human Resource Management Platform for companies to manage employees, attendance, leave, payroll, and performance.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)

## 🎯 Overview

HRPlatform is a comprehensive HRIS (Human Resource Information System) built with enterprise-grade architecture following SOLID principles. It includes:

- **Core HR**: Employee management, organizational structure, document management
- **Attendance & Time**: Biometric integration, shift management, overtime tracking
- **Leave Management**: Multi-type leaves, approval workflows, balance tracking
- **Payroll**: Multi-country support (India & US), statutory compliance, bank file generation
- **Performance**: Goal management, reviews, 360-degree feedback
- **Recruitment**: ATS, candidate tracking, interview scheduling
- **Analytics**: Real-time dashboards, custom reports, predictive analytics

## 🏗️ Architecture

- **Monorepo**: Turborepo with Yarn workspaces
- **Backend**: Node.js + TypeScript following Clean Architecture
- **Frontend**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for sessions and rate limiting
- **Logging**: Winston + Elasticsearch + Kibana
- **Testing**: Jest + React Testing Library

## 📁 Project Structure

```
hrplatform-crm/
├── apps/
│   ├── web/                 # Company CRM Portal (Next.js)
│   ├── mobile/              # React Native (Stage 3)
│   └── workers/             # Background Jobs (Stage 2)
├── packages/
│   ├── database/            # Prisma schema & migrations
│   ├── core/                # Business logic (domain modules)
│   ├── ui/                  # Shared UI components
│   ├── types/               # TypeScript types
│   ├── utils/               # Shared utilities
│   └── config/              # Shared configs
├── super-admin-docs/        # Documentation for separate Super Admin repo
└── scripts/                 # Build & deployment scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ ([Download](https://nodejs.org/))
- Yarn 4.0+ (installed automatically with corepack)
- Docker & Docker Compose ([Download](https://www.docker.com/get-started))
- Git

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/hrplatform.git
cd hrplatform
```

### 2. Enable Corepack (for Yarn 4)

```bash
corepack enable
corepack prepare yarn@4.1.0 --activate
```

### 3. Install dependencies

```bash
yarn install
```

### 4. Setup environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

### 5. Start Docker services

```bash
# Start PostgreSQL, Redis, Elasticsearch, Kibana
yarn docker:up

# Wait for services to be healthy (check with)
yarn docker:logs
```

### 6. Run database migrations

```bash
yarn db:migrate:dev
yarn db:seed  # Optional: seed with sample data
```

### 7. Start development servers

```bash
yarn dev
```

This will start:
- Web app (CRM): http://localhost:3000
- Kibana (logs): http://localhost:5601
- Mailhog (emails): http://localhost:8025

## 🔧 Development

### Available Scripts

```bash
# Development
yarn dev                     # Start all apps in dev mode
yarn build                   # Build all apps for production
yarn test                    # Run all tests
yarn test:watch              # Run tests in watch mode
yarn test:coverage           # Generate coverage report
yarn lint                    # Lint all packages
yarn lint:fix                # Fix linting issues
yarn type-check              # TypeScript type checking
yarn format                  # Format code with Prettier

# Database
yarn db:migrate:dev          # Create and apply migration
yarn db:migrate              # Apply pending migrations
yarn db:studio               # Open Prisma Studio
yarn db:seed                 # Seed database with sample data
yarn db:reset                # Reset database (DANGER!)

# Docker
yarn docker:up               # Start all services
yarn docker:down             # Stop all services
yarn docker:restart          # Restart all services
yarn docker:logs             # View all logs
yarn docker:logs:elasticsearch  # View Elasticsearch logs
yarn docker:logs:kibana      # View Kibana logs
yarn docker:clean            # Remove all volumes (DANGER!)

# Deployment
yarn deploy:web              # Deploy web app to Vercel
```

### Code Organization

#### Clean Architecture Layers

```
packages/core/
├── domain/              # Entities, Value Objects, Domain Events
├── application/         # Use Cases, DTOs, Interfaces
├── infrastructure/      # External dependencies (DB, APIs, etc.)
└── presentation/        # Controllers, Validators
```

#### Example: Employee Module

```
packages/core/src/employees/
├── domain/
│   ├── entities/
│   │   └── employee.entity.ts         # Employee domain entity
│   ├── value-objects/
│   │   ├── email.vo.ts                # Email value object
│   │   └── aadhaar.vo.ts              # Aadhaar value object
│   └── events/
│       └── employee-created.event.ts  # Domain event
├── application/
│   ├── use-cases/
│   │   ├── create-employee.use-case.ts
│   │   └── update-employee.use-case.ts
│   ├── dtos/
│   │   └── create-employee.dto.ts
│   └── interfaces/
│       └── employee.repository.interface.ts
└── infrastructure/
    ├── repositories/
    │   └── prisma-employee.repository.ts
    └── services/
        └── encryption.service.ts
```

## 📊 Logging & Monitoring

### Log Levels

- `error`: Error messages that need immediate attention
- `warn`: Warning messages for potential issues
- `info`: General informational messages
- `http`: HTTP request/response logs
- `debug`: Detailed debugging information
- `audit`: Security and compliance audit logs

### Viewing Logs

**Console (Development)**:
```bash
# Logs automatically printed to console in development
yarn dev
```

**File Logs**:
```bash
# Check log files
cat logs/combined.log
cat logs/error.log
cat logs/audit.log
```

**Kibana (Recommended)**:
1. Open http://localhost:5601
2. Go to "Discover"
3. Create index pattern: `hrplatform-logs-*`
4. View and filter logs

### Structured Logging Example

```typescript
import { logger } from '@hrplatform/core/infrastructure/logging';

// Log with context
logger.info('Employee created', {
  userId: user.id,
  companyId: company.id,
  employeeId: employee.id,
  action: 'EMPLOYEE_CREATE'
});

// Error logging
try {
  // ... code
} catch (error) {
  logger.error('Failed to create employee', {
    error: error.message,
    stack: error.stack,
    userId: user.id,
    companyId: company.id
  });
  throw error;
}

// Audit logging
logger.audit('Sensitive data accessed', {
  userId: user.id,
  companyId: company.id,
  resourceType: 'EMPLOYEE_SALARY',
  resourceId: employee.id,
  action: 'READ'
});
```

## 🔒 Security

- **Encryption**: AES-256-GCM for PII (Aadhaar, PAN, Bank details)
- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Multi-tenancy**: Row-level security with company isolation
- **Rate Limiting**: Redis-backed rate limiting
- **Audit Logging**: Complete audit trail of all operations
- **Data Retention**: Configurable retention policies

## 🧪 Testing

```bash
# Run all tests
yarn test

# Run tests with coverage
yarn test:coverage

# Run tests in watch mode
yarn test:watch

# Run specific test file
yarn test employee.service.test.ts
```

### Test Structure

```
src/
├── employees/
│   ├── __tests__/
│   │   ├── employee.service.test.ts
│   │   ├── employee.repository.test.ts
│   │   └── create-employee.use-case.test.ts
│   └── ...
```

## 📚 Documentation

- [Features Documentation](./docs/enterprise-crm-features-v2-updated.md)
- [Technical Design](./docs/enterprise-crm-technical-design-v2.md)
- [Analytics Module](./docs/analytics-reporting-module.md)
- [API Documentation](./docs/api/) (Coming soon)

## 🛣️ Roadmap

### Phase 1: Foundation (Current)
- ✅ Monorepo setup
- ✅ Docker Compose setup
- ✅ Logging infrastructure
- ⏳ Database schema
- ⏳ Authentication service
- ⏳ Employee management

### Phase 2: Core HRIS
- ⏳ Attendance & time tracking
- ⏳ Leave management
- ⏳ Basic payroll (India)

### Phase 3: Advanced Features
- ⏳ Performance management
- ⏳ Recruitment & ATS
- ⏳ Mobile apps
- ⏳ US payroll support

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👥 Team

- **Milind Prabhakar** - Project Lead

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [PostgreSQL](https://www.postgresql.org/)
- ORM by [Prisma](https://www.prisma.io/)
- Logging with [Winston](https://github.com/winstonjs/winston)
- Monorepo by [Turborepo](https://turbo.build/)

## 📞 Support

- Documentation: [Read the docs](./docs/)
- Issues: [GitHub Issues](https://github.com/yourusername/hrplatform/issues)
- Email: support@hrplatform.com

---

**Built with ❤️ using enterprise-grade architecture and SOLID principles**
