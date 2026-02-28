import "#config/opentelemetry";

import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger } from "nestjs-pino";
import { AppModule } from './app.module';
import { AppConfigService } from './shared/modules/app-config/app-config.service';

async function bootstrap() {


  // Pass the logger to NestFactory
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const config = app.get(AppConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Listen on 0.0.0.0 for container/network compatibility
  const port = config.app.port;
  await app.listen(port, '0.0.0.0');
  
  // Use the logger to signal startup
  logger.log(`Application is running on: http://localhost:${port}/v1`);
}

bootstrap();




