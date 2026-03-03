# Todos - Project "ERP IAM Demo"

## Tasks / Todos

> Complete the apis and angular web-application with pnpm workspace

### Sprint February (23 -> 27+)

- [x] Init the repository and pre-planning.
- [x] Setup foundations in `nest.js` api-codebase.
- [x] Write & wire all misc. for authentication APIs, must use JWT with `jti` (redis session).
- [x] Scaffold `angular` web-app foundation with authentication.
- [x] Authorization and Tenant APIs + web-app wiring.
- [x] User <-> Tenant APIs & web-app wiring.
- [x] Sample resources e.g. product APIs & web-app wiring (scaffold version).
- [x] Role <-> Tenant <-> ACLs APIs & web-app wiring.
- [x] Audit & Logging (using `TypeORM` on PostgreSQL) APIs & web-app wiring.
- [x] Apply ACLs on resouces and tests (e2e).
- [ ] Make deployment ready using Podman `pods`
- [ ] Record demo-video for presenting/showcase in portfolio.

### Sprint March — Multi-Tenancy Iteration

> New model: `example.com` domain, no subdomain-per-tenant. User ↔ Tenant ↔ Membership.

- [x] Remove `tenant` field from all auth DTOs (`register`, `login`, `forgot-password`).
- [x] Registration now **onboards a tenant** — creates User + Tenant + default Roles + owner Membership in one flow.
- [x] Login resolves tenant context from user's active Membership (no tenant in DTO).
- [x] `SessionService` auto-resolves `tenant_id` from memberships when not explicitly provided.
- [x] Created `RoleService` + `RoleModule` with `ensureDefaultRoles()` (OWNER, ADMIN per tenant).
- [x] Fixed `app.module.ts` to use real `TenantModule` (with TypeORM entities), added `RoleModule`.
- [x] Registered `Permission` entity in `RoleModule` (required by `Role#permissions` ManyToMany).
- [x] Owner can invite users (member invite flow) — **Next Iteration**.
- [x] Invitation accept/decline flow — **Next Iteration**.
- [ ] Owner/Admin can manage user groups, roles & ACLs — **Next Iteration**.
- [ ] Teams support — **Planned for later**.
