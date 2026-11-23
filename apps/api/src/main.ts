import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  const isProduction = config.getOrThrow<boolean>('isProduction');
  const port = config.getOrThrow<number>('app.port');
  const webOrigins = config.getOrThrow<string[]>('app.webOrigins');

  // The API only serves JSON and Swagger UI; CSP is disabled so Swagger can run
  // its inline assets. Helmet's other headers still apply.
  app.use(helmet({ contentSecurityPolicy: false }));

  // Behind the nginx container the client IP arrives via X-Forwarded-For.
  if (isProduction) {
    app.set('trust proxy', 1);
  }

  app.enableCors({
    origin: webOrigins,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-client-id'],
    maxAge: 86_400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(isProduction));

  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('WorldScope API')
    .setDescription(
      'Public country data aggregated from keyless providers (country catalogue, World Bank, Open-Meteo) with Redis caching.',
    )
    .setVersion('1.0')
    .addTag('health')
    .addTag('overview')
    .addTag('countries')
    .addTag('compare')
    .addTag('favorites', 'Anonymous, client-scoped favourites')
    .addTag('comparisons', 'Anonymous, client-scoped saved comparisons')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'WorldScope API docs',
  });

  await app.listen(port, '0.0.0.0');
  Logger.log(`WorldScope API listening on http://localhost:${port}/api/v1`, 'Bootstrap');
  Logger.log(`Swagger UI available at http://localhost:${port}/api/docs`, 'Bootstrap');
}

void bootstrap();
