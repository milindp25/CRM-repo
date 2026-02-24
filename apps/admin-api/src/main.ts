import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParser = require('cookie-parser');
import { AppModule } from './app.module.js';

/**
 * Bootstrap the Admin API application
 * Separate NestJS instance for Super Admin operations
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());

  // Cookie parser for httpOnly cookie auth
  app.use(cookieParser());

  // CORS
  const allowedOrigins = configService
    .get<string>('ADMIN_ALLOWED_ORIGINS', 'http://localhost:3001')
    .split(',');

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-correlation-id'],
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Validation
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

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('HR Platform Admin API')
    .setDescription('Super Admin API for platform management')
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
    .addTag('admin', 'Platform administration endpoints')
    .addTag('addons', 'Feature add-on management')
    .addTag('billing', 'Billing and invoicing')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Start
  // Priority: ADMIN_API_PORT (explicit) > PORT (Render auto-assigns 10000) > 4001 (local dev)
  const port = configService.get<number>('ADMIN_API_PORT') || configService.get<number>('PORT') || 4001;
  // Bind to 0.0.0.0 — required for Render (and most cloud platforms)
  // so the reverse proxy can reach the app
  await app.listen(port, '0.0.0.0');

  logger.log(`Admin API running on http://0.0.0.0:${port}`);
  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);
  logger.log(`Environment: ${configService.get('NODE_ENV', 'development')}`);

  // Graceful shutdown handlers
  const signals = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.log(`Received ${signal}, starting graceful shutdown...`);
      try {
        await app.close();
        logger.log('Admin API shut down gracefully');
        process.exit(0);
      } catch (err) {
        logger.error(`Error during shutdown: ${(err as Error).message}`);
        process.exit(1);
      }
    });
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start Admin API:', err);
  process.exit(1);
});
