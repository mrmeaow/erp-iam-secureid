# Task: #04-9 - Authorization with RBAC & ACLs

> Task issues in repository from #4 to #9

## Description

This task covers the implementation of the Authorization layer, including Tenant isolation, Role-Based Access Control (RBAC), and Attribute-Based Access Control (ACLs). We will also wire these features into the web application and implement a sample resource to verify end-to-end enforcement.

## Steps

### 1. Tenant & Membership Wiring

- [x] **Authorization and Tenant APIs + Web-app wiring**
  - [x] Implement Tenant switching logic on the backend if applicable.
  - [x] Wire Tenant management views in the Angular web-app.
  - [x] Ensure API requests are scoped by `tenant_id` from the JWT/Session.
- [x] **User <-> Tenant APIs & Web-app wiring**
  - [x] Implement Membership management APIs (Add/Remove users from Tenants).
  - [x] Wire User invitation/assignment flow in the web-app.
  - [x] Implement Membership status tracking (Active/Inactive).

### 2. RBAC & ACL Implementation

- [x] **Role <-> Tenant <-> ACLs APIs & Web-app wiring**
  - [x] Expand `RoleService` to support custom roles per Tenant.
  - [x] Implement the `Permission` and `RolePermission` management logic.
  - [x] Create UI for managing Roles and assigning Permissions in the web-app.
- [x] **Sample Resources (Scaffold version)**
  - [x] Create a `Product` entity as a sample resource.
  - [x] Implement CRUD APIs for Products with Tenant isolation.
  - [x] Wire a simple Product management view in the web-app to verify access control.

### 3. Observability & Enforcement

- [x] **Audit & Logging**
  - [x] Ensure all authorization events (Success/Deny) are logged to the `audit_logs` table.
  - [x] Implement an Audit Log viewer in the web-app (Admin only).
  - [x] Wire CRUD operation logging for sample resources (Products).
- [x] **Apply ACLs on Resources and Tests (e2e)**
  - [x] Implement a global `RoleGuard` or `AclGuard` in NestJS.
  - [x] Applydecorators to controllers to enforce granular actions (e.g., `READ_PRODUCTS`, `WRITE_PRODUCTS`).
  - [x] Write e2e tests to verify that User A in Tenant A cannot access resources in Tenant B.
  - [x] Verify that a user without the 'ADMIN' role cannot perform deletions even within their own tenant.

---

## Verifications

- [ ] Manual verification (Swagger UI (`/api/docs`)) tester: myself.
- [ ] Manual verification (Angular Dashboard components) tester: myself.
- [x] Write real-world edge-case driven e2e tests for APIs a must.
- [x] Write ng test for the authorization layer verification for enforcements is a must.
- [ ] All e2e tests must pass as our expectation.
