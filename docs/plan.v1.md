# 🔹 SecureID (IAM / Identity Access Mgmt) – Full Functionality & Data Flow (Podman-Only Setup)

**Project:** SecureID Platform (IAM / Multi-Tenant Auth)  
**Deployment:** Podman pods only (no K3s/K8s or Cloud/PaaS deployment for now)  
**Goal:** Complete functional platform showcasing full-stack, enterprise-grade IAM, multi-tenancy, and RBAC.

**:gear: Tech Stack:**

- Nest.js (platform-fastify)
- TypeORM with PostgreSQL
- Redis
- Angular (v21; zoneless; signals) web-application
- PNPM workspace for monorepo mgmt
- Seq & Winston (_planned_) for observalibity {logs}

---

## 1. Core Functional Modules

| Module                             | Responsibility                                                | Notes                                                                        |
| ---------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Auth Service**                   | Handles login, registration, token issuance, password hashing | Uses JWT for stateless sessions; integrates Redis for session, caching, etc. |
| **Tenant Service**                 | Manages tenant registration and status                        | Created during user onboarding; no subdomain routing                         |
| **User Service**                   | CRUD for users, activation status                             | Users exist independently; linked to tenants via Membership                  |
| **Membership Service**             | Links Users ↔ Tenants with a Role                             | Supports multi-tenant membership; OWNER set at registration                  |
| **Role Service**                   | Create roles scoped per tenant                                | Default roles: OWNER, ADMIN, MEMBER; custom roles supported                  |
| **Permission Service**             | Defines resource/action access rules                          | Granular control for enterprise systems                                      |
| **RolePermission Mapping Service** | Maps roles to permissions                                     | Many-to-many; allows flexible access control                                 |
| **Session Service**                | JWT token validation, session expiration, revocation          | Redis-backed for fast lookup; tenant resolved from membership                |
| **Audit Service**                  | Logs all user/admin actions                                   | PostgreSQL-backed (`audit_logs` table)                                       |
| **Frontend (Angular)**             | Admin + User dashboards                                       | Admin manages tenants, roles, users; User sees personal info and permissions |
| **Reverse Proxy**                  | Routes requests to services, handles SSL/TLS                  | Can be Nginx / Caddy2 / Traefik in Podman pod                                |

---

## 2. Full Functionality (End-to-End Features)

### 2.1 Authentication

> **Domain model:** `example.com` — no `tenant-x.example.com` subdomains. Tenant resolved from memberships.

- User registration → creates User + Tenant + default Roles (OWNER, ADMIN) + Membership (OWNER)
- Login → check credentials by email only → resolve tenant from membership → generate JWT → store session in Redis
- Refresh token flow → issue new access tokens using stored `tenantId` in JWT payload
- Logout → remove session from Redis

### 2.2 Authorization

- Role-based access control (RBAC) → map user → role (via Membership) → permissions
- Resource-level checks → restrict actions (read/write/delete)
- Tenant-level scoping → users cannot access other tenants

### 2.3 Tenant Management

- Tenant is created automatically during owner registration (onboarding)
- Owner can invite new users as members — invitation accept/decline flow _(Next Iteration)_
- Tenant status: active, suspended, archived
- Owner/Admin can manage user groups, roles, ACLs _(Next Iteration)_
- Teams support _(Planned for later iteration)_

### 2.4 User & Role Management

- Create/update/delete users
- Assign roles to users via Membership
- Role creation per tenant (scoped)
- Permission assignment per role

### 2.5 Audit & Logging

- Log user actions: login, logout, CRUD operations (`audit_logs` table in PostgreSQL)
- Log admin actions: tenant changes, role/permission updates
- Metrics: login success/fail, session counts, active users per tenant

### 2.6 API Layer

- REST endpoints for all CRUD and auth flows
- Middleware: JWT validation, tenant check (from membership), RBAC enforcement

### 2.7 Frontend

- Angular admin dashboard: tenants, users, roles, permissions
- Angular user dashboard: profile, permissions overview, session info
- Optional: audit log viewer (admins only)

---

## 3. Data Flow (Step-by-Step)

### 3.1 User Registration / Onboarding Flow _(Updated)_

1. Frontend submits `{ email, password, name, companyName }`
2. AuthService checks email is not already registered
3. UserService creates User (no tenant_id on user)
4. TenantService creates Tenant from `companyName`
5. RoleService ensures default roles (OWNER, ADMIN) for the tenant
6. TenantService creates Membership linking user → tenant as OWNER
7. SessionService creates session with `tenantId` from the new tenant
8. AuditService logs creation event

---

### 3.2 Login Flow _(Updated)_

1. User submits `{ email, password }` — no `tenant` field required
2. Auth Service fetches user by email → validates password
3. SessionService looks up user's first active Membership to resolve `tenant_id`
4. Generate JWT access token + refresh token (payload includes `tenantId`)
5. Store session in Redis with expiration
6. AuditService logs login attempt (success/fail)
7. Return JWT to frontend

---

### 3.3 RBAC / Resource Access

1. User requests protected resource → API middleware intercepts
2. Middleware extracts JWT → SessionService validates → reads `tenantId` from JWT
3. RoleService maps roles (via Membership) → permissions
4. PermissionService checks requested action → allow/deny
5. AuditService logs action if admin-level or critical operation

---

### 3.4 Tenant Isolation

- Every query filtered by `tenant_id` from JWT payload
- Roles, memberships, permissions, audit logs all scoped per tenant
- Prevents cross-tenant access

---

### 3.5 Session & Token Flow

- JWT token: short-lived, stored client-side; carries `tenantId`, `sub`, `email`, `jti`
- Refresh token: long-lived, stored server-side in Redis under `session:{userId}:{jti}`
- Logout or token expiry → session invalidated in Redis
- Token refresh rotates the session (old `jti` revoked, new one issued)

---

### 3.6 Admin Dashboard Flow

1. Admin logs in → JWT validated
2. Fetch tenant users + roles + permissions (all scoped to JWT `tenantId`)
3. Create/edit roles or assign permissions
4. Invite new users or manage memberships
5. AuditService logs all admin actions

---

## 4. Database Schema Overview

**Primary Tables (PostgreSQL)**

- `tenants(tenant_id PK, name, domain?, status, created_at, updated_at)`
- `users(user_id PK, email UNIQUE, hashed_password, is_active, last_login, created_at, updated_at)`
- `memberships(membership_id PK, user_id FK, tenant_id FK, role_id FK, is_active, created_at, updated_at)`
- `roles(role_id PK, tenant_id FK, name, description, created_at, updated_at)` — unique per `(name, tenant_id)`
- `permissions(permission_id PK, resource, action)` — unique per `(resource, action)`
- `role_permissions(role_id FK, permission_id FK)`
- `audit_logs(id PK, event, user_id, tenant_id?, payload, ip_address, user_agent, created_at)`

> ⚠️ **Changed from original plan:** `users` no longer has a `tenant_id` column. Tenant association is via `memberships`.

**Session Store (Redis)**

- Key: `session:{userId}:{jti}`
- Value: `{ userId, tenantId, jti }` (JSON, TTL = refresh token expiry)

---

## 5. Podman Deployment Structure (Simplified)

```
podman pod create --name secureid-pod
podman run -d --pod secureid-pod --name postgres postgres:16
podman run -d --pod secureid-pod --name redis redis:7
podman run -d --pod secureid-pod --name api-server secureid-api:latest
podman run -d --pod secureid-pod --name web-app secureid-webapp:latest
podman run -d --pod secureid-pod --name nginx-proxy nginx:latest # or caddy2
```

- Each service isolated but within **single pod for local dev**
- Supports local dev → staging simulation

---

## 7. Next Steps for Implementation

1. ~~Implement **PostgreSQL schema + seed data**~~ ✅ (auto-synced in dev via TypeORM `synchronize: true`)
2. ~~Build **Nest.js auth services**~~ ✅
3. ~~Integrate **JWT & Redis sessions**~~ ✅
4. **Next Iteration (urgent.md):** Invitation flow (owner invites members), ACLs, Roles, Permissions, Teams
5. Create **Angular admin dashboard**
6. Test **RBAC + tenant isolation** with multiple simulated tenants
7. Deploy locally with Podman pod and test end-to-end
8. Record **demo video** for portfolio

> This approach ensures a **full enterprise-grade IAM project**, ideal for first flagship system build.
