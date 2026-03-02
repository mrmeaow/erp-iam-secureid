# API Coding Rules

## Checklist

- Always use or remember that, we are using `@nestjs/platform-fastify` instead of `@nestjs/platform-express`.
- Always use `pnpm` for package management.
- Always Remember that, we are using `pnpm workspace` for monorepo management.
- Always use `@nestjs/swagger` driven OPENAPI API contract first approach.
- Always use our shared `app-config` module for configuration management e.g. `env` variables, `secrets`, etc.
- Always use our shared `lib/hash.ts` for password hashing and verification.
- Always use OPENAPI contract driven incoming request validation and outgoing response dynamic schema generation.
- USE `@nestjs/typeorm` for postgresql connection on demand.
- USE `@nestjs/jwt` for jwt token using our local-generated `keys` (RS256 key-pair).
- USE `ioredis` based shared redis module for redis connection on demand.
- USE logger for logging on demand or where it suits best for observability.
- DEFINE & USE custom auth-related types e.g. `AuthToken`, `AuthSession`, `JwtPayload`, etc. in `src/config/types/auth.types.ts`.
- Must have `@nestjs/terminus` for health check to serve `/health` endpoint professionally.
- Must have BullMQ for queue management on demand e.g. `send-email`, etc. using our shared redis module and `@nestjs/bullmq` + `bullmq` ... deps.
- Must have `@nestjs/schedule` for scheduled tasks on demand e.g. `cleanup-expired-sessions`, etc. using our shared redis module and `@nestjs/schedule` ... deps.
- Must have `@nestjs/throttler` for rate limiting on demand e.g. `login`, `register`, etc. using our shared redis module and `@nestjs/throttler` ... deps.
- Must exclude sensitive fields in entities use `@Exclude` e.g. password or similar fields.
- Must use `class-transformer` for transforming entities to DTOs and vice versa.
- Must use `class-validator` for validating incoming requests.
- Must use `@ApiProperty` for documenting fields in DTOs and entities.
- Must use `@ApiOperation` for documenting APIs in controllers.
- Must wire swagger api docs at path `/api/docs` and `/api/openapi.json`.
- Must follow a consistent naming convention for APIs, DTOs, Entities, and other files.
- Must follow industry standard APIs for query data e.g. pagination, sorting, filtering, and searching capabilities on demand.
