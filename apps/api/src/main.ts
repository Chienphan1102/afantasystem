import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);

  // CORS
  const corsOrigin = config.get<string>('CORS_ORIGIN', 'http://localhost:5173');
  app.enableCors({ origin: corsOrigin.split(','), credentials: true });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api', { exclude: ['health', 'docs'] });

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AFANTA API')
    .setDescription('AFANTA Omni-Channel Platform — Backend API')
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('Auth')
    .addTag('Tenants')
    .addTag('Users')
    .addTag('Roles')
    .addTag('Groups')
    .addTag('Health')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = parseInt(config.get<string>('API_PORT', '3000'), 10);
  const host = config.get<string>('API_HOST', '0.0.0.0');
  await app.listen(port, host);

  const logger = app.get(Logger);
  logger.log(`🚀 AFANTA API listening on http://localhost:${port}`);
  logger.log(`📘 Swagger docs at http://localhost:${port}/docs`);
  logger.log(`💚 Health check at http://localhost:${port}/health`);
}

bootstrap().catch((err: unknown) => {
  console.error('❌ Failed to bootstrap AFANTA API:', err);
  process.exitCode = 1;
});
