# 🔹 SecureID (IAM / Identity Access Mgmt) – Full Functionality & Data Flow (Podman-Only Setup)

**Project:** SecureID Platform (IAM / Multi-Tenant Auth)  
**Deployment:** Podman pods only (no K3s/K8s or Cloud/PaaS deployment for now)  
**Goal:** Complete functional platform showcasing full-stack, enterprise-grade IAM, multi-tenancy, and RBAC.

**:gear: Tech Stack:**

- Nest.js (platform-fastify)
- TypeORM with PostgreSQL
- Redis and MongoDB
- Angular (v21; zoneless; signals) web-application
- PNPM workspace for monorepo mgmt
- Seq & Winston (_planned_) for observalibity {logs}

---

## 1. Core Functional Modules

| Module                             | Responsibility                                                | Notes                                                                        |
| ---------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Auth Service**                   | Handles login, registration, token issuance, password hashing | Uses JWT for stateless sessions; integrates Redis for session, caching, etc. |
| **Tenant Service**                 | Manages tenant registration, status, and domain               | Each tenant isolated logically                                               |
| **User Service**                   | CRUD for users, tenant association, activation status         | Handles password reset flow                                                  |
| **Role Service**                   | Create roles scoped per tenant                                | Supports default roles (Admin, User) and custom roles                        |
| **Permission Service**             | Defines resource/action access rules                          | Granular control for enterprise systems                                      |
| **UserRole Mapping Service**       | Maps users to roles                                           | Many-to-many; supports multiple roles per user                               |
| **RolePermission Mapping Service** | Maps roles to permissions                                     | Many-to-many; allows flexible access control                                 |
| **Session Service**                | JWT token validation, session expiration, revocation          | Redis-backed for fast lookup                                                 |
| **Audit Service**                  | Logs all user/admin actions                                   | Optional MongoDB storage; high-volume logs possible                          |
| **Frontend (Angular)**             | Admin + User dashboards                                       | Admin manages tenants, roles, users; User sees personal info and permissions |
| **Reverse Proxy**                  | Routes requests to services, handles SSL/TLS                  | Can be Nginx / Caddy2 / Traefik in Podman pod                                |

---

## 2. Full Functionality (End-to-End Features)

### 2.1 Authentication

- User registration → validate email/tenant → store hashed password
- Login → check credentials → generate JWT → store session in Redis
- Refresh token flow → issue new access tokens
- Logout → remove session from Redis

### 2.2 Authorization

- Role-based access control (RBAC) → map user → role → permissions
- Resource-level checks → restrict actions (read/write/delete)
- Tenant-level scoping → users cannot access other tenants

### 2.3 Tenant Management

- Register new tenants (company/org)
- Assign default admin & roles
- Tenant status: active, suspended, archived
- Optional domain mapping for SaaS subdomains

### 2.4 User & Role Management

- Create/update/delete users
- Assign roles to users (multi-role allowed)
- Role creation per tenant
- Permission assignment per role

### 2.5 Audit & Logging

- Log user actions: login, logout, CRUD operations
- Log admin actions: tenant changes, role/permission updates
- Optional: push logs to MongoDB for flexible querying
- Metrics: login success/fail, session counts, active users per tenant

### 2.6 API Layer

- REST endpoints for all CRUD and auth flows
- Optional GraphQL layer for flexible client queries
- Middleware: JWT validation, tenant check, RBAC enforcement

### 2.7 Frontend

- Angular admin dashboard: tenants, users, roles, permissions
- Angular user dashboard: profile, permissions overview, session info
- Optional: audit log viewer (admins only)

---

## 3. Data Flow (Step-by-Step)

### 3.1 User Registration Flow

1. Frontend submits registration request → Tenant + User info
2. Auth Service validates tenant & email
3. User Service stores hashed password in PostgreSQL
4. Default roles assigned via RoleService + UserRole mapping
5. AuditService logs creation event

---

### 3.2 Login Flow

1. User submits credentials → Auth Service
2. Auth Service verifies password → User Service checks active status
3. Generate JWT access token + refresh token
4. Store session in Redis with expiration
5. AuditService logs login attempt (success/fail)
6. Return JWT to frontend → User can access permitted endpoints

---

### 3.3 RBAC / Resource Access

1. User requests protected resource → API middleware intercepts
2. Middleware extracts JWT → SessionService validates → UserService fetches roles
3. RoleService maps roles → permissions
4. PermissionService checks requested action → allow/deny
5. AuditService logs action if admin-level or critical operation

---

### 3.4 Tenant Isolation

- Every query filtered by `tenant_id`
- Roles, users, permissions, audit logs all scoped per tenant
- Prevents cross-tenant access

---

### 3.5 Session & Token Flow

- JWT token: short-lived, stored client-side
- Refresh token: long-lived, stored server-side in Redis
- Logout or token expiry → session invalidated in Redis
- Optional: rotate keys every N days, enforce tenant-level token revocation

---

### 3.6 Admin Dashboard Flow

1. Admin logs in → JWT validated
2. Fetch tenant users + roles + permissions
3. Create/edit roles or assign permissions
4. Create new users or assign roles
5. AuditService logs all admin actions

---

## 4. Database Schema Overview

**Primary Tables (PostgreSQL)**

- `tenants(tenant_id PK, name, domain, status, created_at)`
- `users(user_id PK, tenant_id FK, email, hashed_password, is_active, created_at, last_login)`
- `roles(role_id PK, tenant_id FK, name, description)`
- `permissions(permission_id PK, resource, action)`
- `user_roles(user_id FK, role_id FK)`
- `role_permissions(role_id FK, permission_id FK)`

**Session Store (Redis)**

- Key: `session:<session_id>`
- Value: `{user_id, tenant_id, jwt, refresh_token, expires_at}`

**Audit Logs (Optional MongoDB)**

- Collection: `audit_logs`
- Document: `{log_id, tenant_id, user_id, action, metadata, timestamp}`

---

## 5. Podman Deployment Structure (Simplified)

```
podman pod create --name secureid-pod
podman run -d --pod secureid-pod --name postgres postgres:16
podman run -d --pod secureid-pod --name redis redis:7
podman run -d --pod secureid-pod --name mongo mongo:7
podman run -d --pod secureid-pod --name api-server secureid-api:latest
podman run -d --pod secureid-pod --name web-app secureid-webapp:latest
podman run -d --pod secureid-pod --name nginx-proxy nginx:latest # or caddy2
```

- Each service isolated but within **single pod for local dev**
- Supports local dev → staging simulation

---

## 7. Next Steps for Implementation

1. Implement **PostgreSQL schema + seed data**
2. Build **Nest.js services** with modular design
3. Integrate **JWT & Redis sessions**
4. Create **Angular admin dashboard**
5. Add **Audit logging** (MongoDB optional)
6. Test **RBAC + tenant isolation** with multiple simulated tenants
7. Deploy locally with Podman pod and test end-to-end
8. Record **demo video** for portfolio

> This approach ensures a **full enterprise-grade IAM project**, ideal for first flagship system build.
