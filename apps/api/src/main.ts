import 'reflect-metadata';

import '#config/opentelemetry';

import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Logger } from 'nestjs-pino';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';
import { AppConfigService } from './shared/modules/app-config/app-config.service';

async function bootstrap() {
  // Pass the logger to NestFactory
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    },
  );

  const config = app.get(AppConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableCors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    credentials: true,
  });

  // Swagger setup`
  const introPath = join(__dirname, 'config/docs/intro.md');
  const intro = readFileSync(introPath, 'utf8');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SECURE.ID API')
    .setDescription(intro)
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // Swagger
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/swagger', app, document);

  // Serve JSON
  const fastify = app.getHttpAdapter().getInstance();
  fastify.get('/openapi.json', async (request, reply) => {
    reply.header('Content-Type', 'application/json').send(document);
  });

  // Scalar
  app.use(
    '/api/docs',
    apiReference({
      url: '/openapi.json',
      // content: document,
      withFastify: true, // Required when using Fastify adapter
    }),
  );

  const port = config.app.port;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Application is running on: http://localhost:${port}/v1`);
  logger.log(`📚 Swagger docs: http://localhost:${port}/api/swagger`);
  logger.log(`📘 Scalar docs: http://localhost:${port}/api/docs`);
}

bootstrap();
