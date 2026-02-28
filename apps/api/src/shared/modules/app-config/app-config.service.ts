import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Strongly-typed wrapper around NestJS ConfigService.
 * All env vars are loaded through this service — never use process.env directly.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly cfg: ConfigService) {}

  // ── App ───────────────────────────────────────────────────────────────────
  get app() {
    return {
      name: this.cfg.getOrThrow<string>('APP_NAME'),
      port: this.cfg.getOrThrow<number>('PORT'),
      env: this.cfg.getOrThrow<string>('NODE_ENV'),
      isDev: ['dev', 'development'].includes(this.cfg.getOrThrow<string>('NODE_ENV')),
      isProd: ['prod', 'production'].includes(this.cfg.getOrThrow<string>('NODE_ENV')),
      isStaging: ['staging', 'stage'].includes(this.cfg.getOrThrow<string>('NODE_ENV')),
      isTest: ['test', 'testing'].includes(this.cfg.getOrThrow<string>('NODE_ENV')),
    };
  }

  // ── Database ──────────────────────────────────────────────────────────────
  get db() {
    return {
      host: this.cfg.getOrThrow<string>('DB_HOST'),
      port: this.cfg.getOrThrow<number>('DB_PORT'),
      user: this.cfg.getOrThrow<string>('DB_USER'),
      password: this.cfg.getOrThrow<string>('DB_PASSWORD'),
      name: this.cfg.getOrThrow<string>('DB_NAME'),
    };
  }

  // ── Redis ─────────────────────────────────────────────────────────────────
  get redis() {
    return {
      host: this.cfg.getOrThrow<string>('REDIS_HOST'),
      port: this.cfg.getOrThrow<number>('REDIS_PORT'),
      password: this.cfg.get<string>('REDIS_PASSWORD'),
      db: this.cfg.get<number>('REDIS_DB') ?? 0,
    };
  }

  // ── JWT ───────────────────────────────────────────────────────────────────
  get jwt() {
    return {
      privateKey: this.cfg.getOrThrow<string>('JWT_PRIVATE_KEY'),
      publicKey: this.cfg.getOrThrow<string>('JWT_PUBLIC_KEY'),
      accessExpiry: this.cfg.get<string>('JWT_ACCESS_EXPIRY') ?? '15m',
      refreshExpiry: this.cfg.get<string>('JWT_REFRESH_EXPIRY') ?? '7d',
      issuer: this.cfg.get<string>('JWT_ISSUER') ?? 'erpiam-svc',
      audience: this.cfg.get<string>('JWT_AUDIENCE') ?? 'erpiam-apps',
    };
  }

  // ── Mail ──────────────────────────────────────────────────────────────────
  get mail() {
    return {
      host: this.cfg.getOrThrow<string>('SMTP_HOST'),
      port: this.cfg.getOrThrow<number>('SMTP_PORT'),
      user: this.cfg.get<string>('SMTP_USER'),
      password: this.cfg.get<string>('SMTP_PASSWORD'),
      from: this.cfg.get<string>('SMTP_FROM') ?? 'no-reply@erpiam.local',
      fromName: this.cfg.get<string>('SMTP_FROM_NAME') ?? 'ERP.IAM',
    };
  }

  // ── Logging ───────────────────────────────────────────────────────────────
  get logging() {
    return {
      level: this.cfg.get<string>('LOG_LEVEL') ?? 'info',
      seqUrl: this.cfg.get<string>('SEQ_URL'),
      seqApiKey: this.cfg.get<string>('SEQ_API_KEY'),
    };
  }

  // ── OpenObserve ───────────────────────────────────────────────────────────
  get openObserve() {
    return {
      url: this.cfg.getOrThrow<string>('OPENOBSERVE_LOGS_ENDPOINT'),
      organization: this.cfg.getOrThrow<string>('OPENOBSERVE_ORGANIZATION'),
      streamName: this.cfg.getOrThrow<string>('OPENOBSERVE_STREAM_NAME'),
      username: this.cfg.getOrThrow<string>('OPENOBSERVE_USERNAME'),
      password: this.cfg.getOrThrow<string>('OPENOBSERVE_PASSWORD'),
    };
  }

  // ── OpenTelemetry ─────────────────────────────────────────────────────────
  get otel() {
    return {
      tracesEndpoint: this.cfg.getOrThrow<string>('OTEL_EXPORTER_OTLP_TRACES_ENDPOINT'),
      logsEndpoint: this.cfg.getOrThrow<string>('OTEL_EXPORTER_OTLP_LOGS_ENDPOINT'),
    };
  }
}