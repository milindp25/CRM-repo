import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ApiKeyThrottlerGuard } from './common/guards/api-key-throttler.guard';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { DepartmentModule } from './modules/department/department.module';
import { DesignationModule } from './modules/designation/designation.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { LeaveModule } from './modules/leave/leave.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { UsersModule } from './modules/users/users.module';
import { CompanyModule } from './modules/company/company.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationModule } from './modules/notification/notification.module';
import { InvitationModule } from './modules/invitation/invitation.module';
import { DocumentModule } from './modules/document/document.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { ApiKeyModule } from './modules/api-key/api-key.module';
import { CustomFieldModule } from './modules/custom-field/custom-field.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { ImportExportModule } from './modules/import-export/import-export.module';
import { AssetModule } from './modules/asset/asset.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { RecruitmentModule } from './modules/recruitment/recruitment.module';
import { TrainingModule } from './modules/training/training.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { ShiftModule } from './modules/shift/shift.module';
import { PolicyModule } from './modules/policy/policy.module';
import { LeavePolicyModule } from './modules/leave-policy/leave-policy.module';
import { OffboardingModule } from './modules/offboarding/offboarding.module';
import { SocialModule } from './modules/social/social.module';
import { SurveyModule } from './modules/survey/survey.module';
import { TimesheetModule } from './modules/timesheet/timesheet.module';
import { ContractorModule } from './modules/contractor/contractor.module';
import { GeofenceModule } from './modules/geofence/geofence.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { GatewayModule } from './common/gateways/gateway.module';
import { validate } from './config/env.validation';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerService } from './common/services/logger.service';
import { CacheService } from './common/services/cache.service';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { CompanyIsolationGuard } from './common/guards/company-isolation.guard';
import { SubscriptionGuard } from './common/guards/subscription.guard';
import { FeatureGuard } from './common/guards/feature.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';

/**
 * Root Application Module
 *
 * Middleware chain (executed first, in order):
 * 1. CorrelationIdMiddleware - Assign/propagate x-correlation-id
 * 2. RequestLoggingMiddleware - Log every HTTP request/response with timing
 *
 * Guard execution order (registered as APP_GUARD):
 * 1. JwtAuthGuard       - Authenticate user (skip if @Public())
 * 2. ThrottlerGuard     - Rate limiting
 * 3. CompanyIsolation   - Multi-tenancy enforcement
 * 4. SubscriptionGuard  - Check subscription is active
 * 5. FeatureGuard       - Check feature is enabled for company
 * 6. RolesGuard         - Check user role matches @Roles()
 * 7. PermissionsGuard   - Check granular permissions via @RequirePermissions()
 */
@Module({
  imports: [
    // Environment Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validate,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'auth',
        ttl: 60000,
        limit: 10,
      },
    ]),

    // Event System
    EventEmitterModule.forRoot(),

    // Task Scheduling
    ScheduleModule.forRoot(),

    // Core Modules
    DatabaseModule,

    // Feature Modules
    HealthModule,
    AuthModule,
    EmployeeModule,
    DepartmentModule,
    DesignationModule,
    AttendanceModule,
    LeaveModule,
    PayrollModule,
    UsersModule,
    CompanyModule,
    AuditModule,
    NotificationModule,
    InvitationModule,
    DocumentModule,
    WorkflowModule,
    ApiKeyModule,
    CustomFieldModule,
    WebhookModule,
    ImportExportModule,
    AssetModule,
    PerformanceModule,
    RecruitmentModule,
    TrainingModule,
    ExpenseModule,
    ShiftModule,
    PolicyModule,
    LeavePolicyModule,
    OffboardingModule,
    SocialModule,
    SurveyModule,
    TimesheetModule,
    ContractorModule,
    GeofenceModule,
    AnalyticsModule,
    DashboardModule,

    // Real-time WebSocket Gateway
    GatewayModule,
  ],
  controllers: [],
  exports: [CacheService, LoggerService],
  providers: [
    // Common Services
    LoggerService,
    CacheService,

    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },

    // Global Guards (order matters - executed in registration order)
    // 1. Authentication
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 2. Rate Limiting (extends ThrottlerGuard with per-API-key limits)
    {
      provide: APP_GUARD,
      useClass: ApiKeyThrottlerGuard,
    },
    // 3. Multi-tenancy (company data isolation)
    {
      provide: APP_GUARD,
      useClass: CompanyIsolationGuard,
    },
    // 4. Subscription status check
    {
      provide: APP_GUARD,
      useClass: SubscriptionGuard,
    },
    // 5. Feature flag enforcement
    {
      provide: APP_GUARD,
      useClass: FeatureGuard,
    },
    // 6. Role-based access control
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // 7. Granular permission checks
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggingMiddleware)
      .forRoutes('*');
  }
}
