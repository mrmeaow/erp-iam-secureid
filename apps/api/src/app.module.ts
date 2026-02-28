import { AuthModule, UserModule } from '#app';
import { censorObject } from '#config/censor.config';
import { GlobalExceptionFilter } from '#config/filters/global-exception';
import { ResponseInterceptor } from '#config/interceptors/response';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigModule } from './shared/modules/app-config/app-config.module';
import { AppConfigService } from './shared/modules/app-config/app-config.service';

@Module({
  imports: [
    AppConfigModule,
    
    LoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (cfg: AppConfigService) => ({
        pinoHttp: {
          messageKey: 'msg',
          timestamp: false,
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.headers["x-api-key"]',
              'res.headers["set-cookie"]',
            ],
            remove: true,
          },
          formatters: {
            level: (label) => ({ level: label.toUpperCase() }),
          },
          base: {
            service: cfg.app.name,
            version: '1.0.0',
          },
          serializers: {
            req(req) {
              if (req.raw?.body) {
                req.body = censorObject(req.raw.body);
              } else if ((req as any).body) {
                req.body = censorObject((req as any).body);
              }
              return req;
            },
          },
          customProps: (req: any, res: any) => ({
            body: req.body || req.raw?.body ? censorObject(req.body || req.raw.body) : undefined,
            responseData: res.locals?.body ? censorObject(res.locals.body) : undefined,
          }),
          transport: {
            target: '@openobserve/pino-openobserve',
            options: {
              url: cfg.openObserve.url,
              organization: cfg.openObserve.organization,
              streamName: cfg.openObserve.streamName,
              auth: {
                username: cfg.openObserve.username,
                password: cfg.openObserve.password,
              },
              batchSize: cfg.app.isProd ? 100 : 1,
            },
          },
        },
      }),
    }),

    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
