import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { LoggerService } from './common/services/logger.service';

/**
 * Bootstrap the NestJS application
 * Configures security, validation, versioning, graceful shutdown, and documentation
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);

  // Security: Helmet for HTTP headers
  app.use(helmet());

  // Cookie parser for httpOnly cookie auth
  app.use(cookieParser());

  // CORS Configuration
  const allowedOrigins = configService
    .get<string>('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001')
    .split(',');

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-correlation-id'],
  });

  // API Versioning (v1, v2, etc.)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Graceful shutdown
  app.enableShutdownHooks();

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
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Start the server
  const port = configService.get<number>('API_PORT', 4000);
  await app.listen(port);

  logger.log(`HR Platform API running on http://localhost:${port}`, 'Bootstrap');
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`, 'Bootstrap');
  logger.log(`Environment: ${configService.get('NODE_ENV', 'development')}`, 'Bootstrap');

  // Graceful shutdown handlers
  const signals = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.log(`Received ${signal}, starting graceful shutdown...`, 'Shutdown');
      try {
        await app.close();
        logger.log('Application shut down gracefully', 'Shutdown');
        process.exit(0);
      } catch (err) {
        logger.error(`Error during shutdown: ${(err as Error).message}`, (err as Error).stack, 'Shutdown');
        process.exit(1);
      }
    });
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
