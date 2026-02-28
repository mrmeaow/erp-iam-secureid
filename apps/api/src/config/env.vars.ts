import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Staging = 'staging',
  Test = 'test',
}

class EnvironmentVariables {
  // ── App ───────────────────────────────────────────────────────────────────
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsString()
  APP_NAME: string = 'ERP-IAM API Demo';

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3333;

  // ── Database ──────────────────────────────────────────────────────────────
  @IsString()
  DB_HOST: string = 'localhost';

  @IsInt()
  @Min(1)
  DB_PORT: number = 5432;

  @IsString()
  DB_USER: string = 'admin';

  @IsString()
  DB_PASSWORD: string = 'secret';

  @IsString()
  DB_NAME: string = 'erpiam_dev';

  // ── Redis ─────────────────────────────────────────────────────────────────
  @IsString()
  REDIS_HOST: string = 'localhost';

  @IsInt()
  @Min(1)
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  REDIS_DB?: number = 0;

  // ── JWT ───────────────────────────────────────────────────────────────────
  @IsString()
  JWT_PRIVATE_KEY: string = 'dev_placeholder_key';

  @IsString()
  JWT_PUBLIC_KEY: string = 'dev_placeholder_key';

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRY: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRY: string = '7d';

  @IsString()
  @IsOptional()
  JWT_ISSUER: string = 'erpiam-svc';

  @IsString()
  @IsOptional()
  JWT_AUDIENCE: string = 'erpiam-apps';

  // ── Mail ──────────────────────────────────────────────────────────────────
  @IsString()
  SMTP_HOST: string = 'localhost';

  @IsInt()
  @Min(1)
  SMTP_PORT: number = 1025;

  @IsString()
  @IsOptional()
  SMTP_USER: string = 'admin';

  @IsString()
  @IsOptional()
  SMTP_PASSWORD: string = 'password';

  @IsString()
  @IsOptional()
  SMTP_FROM: string = 'no-reply@erpiam.local';

  @IsString()
  @IsOptional()
  SMTP_FROM_NAME: string = 'ERP.IAM';

  // ── Logging ───────────────────────────────────────────────────────────────
  @IsString()
  @IsOptional()
  LOG_LEVEL: string = 'info';

  @IsString()
  @IsOptional()
  SEQ_URL: string;

  @IsString()
  @IsOptional()
  SEQ_API_KEY?: string;

  // ── OpenObserve ───────────────────────────────────────────────────────────
  @IsString()
  @IsOptional()
  OPENOBSERVE_LOGS_ENDPOINT: string = 'http://localhost:5080';

  @IsString()
  @IsOptional()
  OPENOBSERVE_ORGANIZATION: string = 'default';

  @IsString()
  @IsOptional()
  OPENOBSERVE_STREAM_NAME: string = 'default';

  @IsString()
  @IsOptional()
  OPENOBSERVE_USERNAME: string = 'root@example.com';

  @IsString()
  @IsOptional()
  OPENOBSERVE_PASSWORD: string = 'StrongPasswordHere';

  // ── OpenTelemetry ─────────────────────────────────────────────────────────
  @IsString()
  @IsOptional()
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT: string =
    'http://localhost:4318/v1/traces';

  @IsString()
  @IsOptional()
  OTEL_EXPORTER_OTLP_LOGS_ENDPOINT: string = 'http://localhost:4318/v1/logs';
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors
      .map((e) => {
        const constraints = Object.values(e.constraints ?? {}).join(', ');
        return `${e.property}: ${constraints}`;
      })
      .join('\n');
    throw new Error(`Environment validation failed:\n${messages}`);
  }

  return validated;
}
