import { AuthModule, UserModule } from '#app';
import { PermissionModule } from '#app/permission/permission.module';
import { ProductModule } from '#app/product/product.module';
import { censorObject } from '#config/censor.config';
import { GlobalExceptionFilter } from '#config/filters/global-exception';
import { ResponseInterceptor } from '#config/interceptors/response';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogModule } from './app/audit-log/audit-log.module';
import { RoleModule } from './app/role/role.module';
import { TenantModule } from './app/tenant/tenant.module';
import { AppConfigModule } from './shared/modules/app-config/app-config.module';
import { AppConfigService } from './shared/modules/app-config/app-config.service';
import { DatabaseModule } from './shared/modules/database/database.module';
import { MailModule } from './shared/modules/mail/mail.module';
import { RedisModule } from './shared/modules/redis/redis.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    RedisModule,

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
              } else if (req.body) {
                req.body = censorObject(req.body);
              }
              return req;
            },
          },
          customProps: (req: any, res: any) => ({
            body:
              req.body || req.raw?.body
                ? censorObject(req.body || req.raw.body)
                : undefined,
            responseData: res.locals?.body
              ? censorObject(res.locals.body)
              : undefined,
          }),
          transport: cfg.app.isTest
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                },
              }
            : {
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

    AuditLogModule,
    UserModule,
    AuthModule,
    TenantModule,
    RoleModule,
    PermissionModule,
    ProductModule,

    BullModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        connection: {
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password,
          db: config.redis.db,
        },
      }),
    }),
    MailModule,
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
