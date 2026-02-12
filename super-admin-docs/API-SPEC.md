# API Specification

Complete API endpoint specifications for the Super Admin application.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://admin.hrplatform.com/api`

## Authentication

All endpoints require authentication via JWT token in cookies or Authorization header.

```typescript
// Authorization header
Authorization: Bearer <jwt_token>

// Or cookie
Cookie: super_admin_token=<jwt_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* additional error details */ }
  }
}
```

## Endpoints

### Authentication

#### POST /api/auth/login
Login as Super Admin.

**Request:**
```json
{
  "email": "admin@hrplatform.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": "uuid",
      "email": "admin@hrplatform.com",
      "firstName": "Super",
      "lastName": "Admin",
      "role": "SUPER_ADMIN"
    }
  }
}
```

#### POST /api/auth/logout
Logout current Super Admin.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Companies

#### GET /api/companies
Get all companies with pagination.

**Query Parameters:**
- `page` (default: 1)
- `pageSize` (default: 20, max: 100)
- `search` (search by name, code, or email)
- `status` (ACTIVE, INACTIVE)
- `subscriptionTier` (FREE, BASIC, PREMIUM, ENTERPRISE)
- `sortBy` (createdAt, companyName, employeeCount)
- `sortOrder` (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "companies": [
      {
        "id": "uuid",
        "companyCode": "COMP001",
        "companyName": "Acme Corp",
        "email": "contact@acme.com",
        "subscriptionTier": "PREMIUM",
        "subscriptionStatus": "ACTIVE",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "stats": {
          "totalUsers": 25,
          "totalEmployees": 100
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalPages": 5,
      "totalItems": 95
    }
  }
}
```

#### POST /api/companies
Create new company.

**Request:**
```json
{
  "companyCode": "COMP002",
  "companyName": "Tech Solutions Ltd",
  "email": "contact@techsolutions.com",
  "phone": "+1-234-567-8900",
  "subscriptionTier": "BASIC",
  "adminUser": {
    "email": "admin@techsolutions.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "TempPassword123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company": { /* company object */ },
    "adminUser": { /* user object */ }
  },
  "message": "Company created successfully"
}
```

#### GET /api/companies/:id
Get company details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "companyCode": "COMP001",
    "companyName": "Acme Corp",
    "email": "contact@acme.com",
    "phone": "+1-234-567-8900",
    "subscriptionTier": "PREMIUM",
    "subscriptionStatus": "ACTIVE",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "users": [
      {
        "id": "uuid",
        "email": "user@acme.com",
        "firstName": "Jane",
        "lastName": "Smith",
        "role": "COMPANY_ADMIN",
        "isActive": true
      }
    ],
    "stats": {
      "totalUsers": 25,
      "totalEmployees": 100,
      "activeEmployees": 95,
      "departments": 5
    }
  }
}
```

#### PATCH /api/companies/:id
Update company.

**Request:**
```json
{
  "companyName": "Acme Corporation",
  "subscriptionTier": "ENTERPRISE",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated company object */ },
  "message": "Company updated successfully"
}
```

#### DELETE /api/companies/:id
Soft delete company.

**Request:**
```json
{
  "reason": "Client requested account closure"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Company deleted successfully"
}
```

#### GET /api/companies/:id/stats
Get detailed company statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 25,
      "active": 23,
      "inactive": 2
    },
    "employees": {
      "total": 100,
      "active": 95,
      "onLeave": 3,
      "separated": 2
    },
    "attendance": {
      "presentToday": 92,
      "absentToday": 3,
      "averageAttendance": 96.5
    },
    "leaves": {
      "pending": 5,
      "approvedThisMonth": 12
    },
    "storage": {
      "usedMB": 1250,
      "limitMB": 5000
    }
  }
}
```

### Billing

#### GET /api/billing/subscriptions
Get all subscriptions.

**Query Parameters:**
- `page`, `pageSize`
- `status` (active, past_due, canceled)
- `tier` (FREE, BASIC, PREMIUM, ENTERPRISE)

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "sub_xxx",
        "companyId": "uuid",
        "companyName": "Acme Corp",
        "tier": "PREMIUM",
        "status": "active",
        "amount": 299,
        "currency": "USD",
        "interval": "month",
        "currentPeriodEnd": "2024-02-01T00:00:00Z",
        "stripeSubscriptionId": "sub_xxx"
      }
    ],
    "pagination": { /* pagination object */ }
  }
}
```

#### POST /api/billing/subscriptions
Create subscription for company.

**Request:**
```json
{
  "companyId": "uuid",
  "tier": "PREMIUM",
  "interval": "month",
  "paymentGateway": "stripe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": { /* subscription object */ },
    "paymentUrl": "https://stripe.com/checkout/..."
  }
}
```

#### GET /api/billing/invoices
Get all invoices.

**Query Parameters:**
- `page`, `pageSize`
- `status` (paid, pending, failed)
- `companyId`

**Response:**
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "inv_xxx",
        "companyId": "uuid",
        "companyName": "Acme Corp",
        "amount": 299,
        "currency": "USD",
        "status": "paid",
        "invoiceDate": "2024-01-01T00:00:00Z",
        "paidAt": "2024-01-02T00:00:00Z",
        "invoiceUrl": "https://..."
      }
    ],
    "pagination": { /* pagination object */ }
  }
}
```

### Analytics

#### GET /api/analytics/dashboard
Get dashboard metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "companies": {
      "total": 150,
      "active": 142,
      "trial": 8,
      "growth": 12.5
    },
    "users": {
      "total": 2500,
      "activeToday": 1850
    },
    "employees": {
      "total": 12000,
      "active": 11500
    },
    "revenue": {
      "mrr": 45000,
      "arr": 540000,
      "growth": 15.3
    }
  }
}
```

#### GET /api/analytics/revenue
Get revenue analytics.

**Query Parameters:**
- `period` (7d, 30d, 90d, 12m, all)
- `groupBy` (day, week, month)

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": [
      {
        "date": "2024-01",
        "amount": 45000,
        "subscriptions": 150,
        "churn": 2
      }
    ],
    "summary": {
      "totalRevenue": 540000,
      "averageRevenuePerCompany": 3600,
      "churnRate": 1.3
    }
  }
}
```

### Users

#### GET /api/users
Get all users across all companies.

**Query Parameters:**
- `page`, `pageSize`
- `search` (email, name)
- `role` (SUPER_ADMIN, COMPANY_ADMIN, etc.)
- `companyId`
- `isActive`

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "user@company.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "COMPANY_ADMIN",
        "isActive": true,
        "company": {
          "id": "uuid",
          "companyName": "Acme Corp"
        },
        "lastLoginAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": { /* pagination object */ }
  }
}
```

#### POST /api/users/:id/reset-password
Reset user password.

**Request:**
```json
{
  "sendEmail": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "temporaryPassword": "TempPass123" // Only if sendEmail=false
  },
  "message": "Password reset email sent"
}
```

#### POST /api/users/:id/impersonate
Start impersonation session.

**Response:**
```json
{
  "success": true,
  "data": {
    "impersonationToken": "token...",
    "user": { /* impersonated user object */ },
    "expiresAt": "2024-01-15T11:30:00Z"
  }
}
```

### Webhooks

#### POST /api/webhooks/stripe
Stripe webhook handler.

#### POST /api/webhooks/razorpay
Razorpay webhook handler.

## Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| UNAUTHORIZED | 401 | Not authenticated or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMIT | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Internal server error |

## Rate Limiting

- 100 requests per minute per Super Admin
- 429 status code when exceeded
- Rate limit reset time in headers

## Next Steps

- Review [DATABASE-ACCESS.md](./DATABASE-ACCESS.md) for database queries
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for API deployment
- Check [INTEGRATION.md](./INTEGRATION.md) for CRM integration
