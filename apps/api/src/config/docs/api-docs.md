# SecureID API Reference

SecureID is the identity and access service for ERP IAM.
This API provides authentication, tenant-aware authorization, role management, direct membership-level ACL overrides, invitations, product access control, and audit visibility.

## Base URL and Versioning

- Base URL: `/`
- Versioning style: URI versioning (`/v1/...`)
- OpenAPI JSON: `/openapi.json`
- Swagger UI: `/api/swagger`
- Scalar UI: `/api/docs`

## Authentication Model

Protected endpoints require a Bearer access token:

- Header: `Authorization: Bearer <accessToken>`
- Access token is verified with RS256 (`issuer`, `audience`, and signature validation)
- Session validity is enforced server-side (revoked/expired session IDs are rejected)

Primary auth endpoints:

- `POST /v1/auth/register`: register user, optionally bootstrap tenant
- `POST /v1/auth/register-user`: register user without tenant bootstrap
- `POST /v1/auth/login`: issue session tokens
- `POST /v1/auth/refresh`: rotate session and refresh tokens
- `POST /v1/auth/logout`: revoke current session
- `GET /v1/auth/me`: return JWT user context
- `POST /v1/auth/forgot-password`
- `POST /v1/auth/reset-password`
- `POST /v1/auth/change-password`
- `POST /v1/auth/verify-email`

## Tenant Context

Most domain endpoints are tenant-scoped.
The authenticated JWT payload may contain `tenantId`; membership checks use:

- `user_id = user.sub`
- `tenant_id = user.tenantId`
- `is_active = true`

When tenant context is required and missing/inactive, authorization fails.

## Authorization: RBAC + ACL/ABAC

SecureID uses a layered model:

1. RBAC (role permissions)
- Role permissions are loaded from the member's role in the current tenant.
- Permission format: `RESOURCE:ACTION` (for example `PRODUCTS:READ`).

2. Direct membership permissions (ACL/ABAC overrides)
- `membership.permissions` stores JSON permission entries.
- Direct permissions are merged with role permissions.
- Each entry may include `condition` for record-level checks.

3. Condition evaluation
- Current supported conditional type:
  - `owner`: compares `request.body[field]` or `request.params[field]` with `user.sub`
- A placeholder `match` type exists and currently returns `true` (proof-of-concept behavior).

4. Decision rule
- Every permission required by `@Permissions(...)` must match (`every`).

## Permission Strings in Use

Current guards/controllers use these permission keys:

- `PRODUCTS:READ`
- `PRODUCTS:WRITE`
- `AUDIT:READ`

## Endpoint Groups

### Auth
- Public + protected authentication lifecycle operations.

### Tenants
- List current user memberships and tenant members.
- Update member direct permissions at tenant level.

### Invitations
- Send invite, preview invite, accept invite, decline invite.

### Roles
- List tenant roles.
- Create custom role.
- Assign permission IDs to role.

### Permissions
- List available permissions for UI role builders.

### Products
- Protected by `AuthGuard` + `PermissionGuard`.
- Read/write behavior depends on `PRODUCTS:*` permission checks and any ACL conditions.

### Audit Logs
- Protected by `AuthGuard` + `PermissionGuard`.
- Requires `AUDIT:READ`.
- Returns latest tenant audit records.

## Audit Events

Authorization decisions and auth lifecycle operations are written to `audit_logs`.
Current event shape includes:

- `action`
- `actor_id`
- `actor_email`
- `tenant_id`
- `resource_type`
- `resource_id`
- `payload`
- `ip_address`
- `user_agent`
- `created_at`

## Response Envelope

Many endpoints use a common response wrapper for success responses:

- `success: boolean`
- `message?: string`
- `data?: T`

Refer to each endpoint schema in Swagger/Scalar for exact DTO contracts.
