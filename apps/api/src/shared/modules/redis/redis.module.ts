import { Global, Module } from '@nestjs/common';
import { Redis } from 'ioredis';
import { AppConfigModule } from '../app-config/app-config.module';
import { AppConfigService } from '../app-config/app-config.service';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        return new Redis({
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password,
          db: config.redis.db,
        });
      },
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
