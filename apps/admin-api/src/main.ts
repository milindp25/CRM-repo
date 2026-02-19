import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

/**
 * Bootstrap the Admin API application
 * Separate NestJS instance for Super Admin operations
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security: Helmet for HTTP headers
  app.use(helmet());

  // CORS Configuration - allow admin frontend
  const allowedOrigins = configService
    .get<string>('ADMIN_ALLOWED_ORIGINS', 'http://localhost:3001')
    .split(',');

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // API Versioning
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

  // Swagger Documentation
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

  // Start the server
  const port = configService.get<number>('ADMIN_API_PORT', 4001);
  await app.listen(port);

  console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║                                                           ║
    ║   🔧 HR Platform Admin API is running!                   ║
    ║                                                           ║
    ║   📍 Server:        http://localhost:${port}               ║
    ║   📚 API Docs:      http://localhost:${port}/api/docs      ║
    ║   🌍 Environment:   ${configService.get('NODE_ENV', 'development').toUpperCase().padEnd(28)} ║
    ║                                                           ║
    ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap().catch((err) => {
  console.error('Failed to start Admin API:', err);
  process.exit(1);
});
