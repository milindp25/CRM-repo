import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Bootstrap the NestJS application
 * Configures security, validation, versioning, and documentation
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security: Helmet for HTTP headers
  app.use(helmet());

  // CORS Configuration
  const allowedOrigins = configService
    .get<string>('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001')
    .split(',');

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // API Versioning (v1, v2, etc.)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert primitive types automatically
      },
    }),
  );

  // Note: Global filters, interceptors, and guards are configured in app.module.ts
  // using APP_FILTER, APP_INTERCEPTOR, and APP_GUARD tokens for proper DI

  // Swagger/OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('HR Platform API')
    .setDescription(
      'Enterprise HR & CRM Platform API with multi-tenant architecture',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT',
    )
    .addTag('auth', 'Authentication and authorization endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('companies', 'Company management endpoints')
    .addTag('employees', 'Employee management endpoints')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keep auth token in Swagger UI
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Start the server
  const port = configService.get<number>('API_PORT', 4000);
  await app.listen(port);

  console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   🚀 HR Platform API is running!                         ║
    ║                                                           ║
    ║   📍 Server:        http://localhost:${port}               ║
    ║   📚 API Docs:      http://localhost:${port}/api/docs      ║
    ║   ❤️  Health:       http://localhost:${port}/v1/health     ║
    ║   🌍 Environment:   ${configService.get('NODE_ENV', 'development').toUpperCase().padEnd(28)} ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});
