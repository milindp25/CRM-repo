import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AdminModule } from './admin/admin.module.js';
import { AddonModule } from './addon/addon.module.js';
import { BillingModule } from './billing/billing.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformInterceptor } from './common/interceptors/transform.interceptor.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';

/**
 * Admin API Application Module
 *
 * Simplified guard chain (3 guards vs tenant API's 7):
 * 1. JwtAuthGuard    - Authenticate user
 * 2. ThrottlerGuard  - Rate limiting
 * 3. RolesGuard      - Enforce SUPER_ADMIN role
 *
 * No need for: CompanyIsolation, Subscription, Feature, Permissions guards
 */
@Module({
  imports: [
    // Environment Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Core
    DatabaseModule,
    AuthModule,

    // Feature Modules
    AdminModule,
    AddonModule,
    BillingModule,
  ],
  providers: [
    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },

    // Global Guards (simplified chain)
    // 1. Authentication
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 2. Rate Limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // 3. Role-based access control
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
