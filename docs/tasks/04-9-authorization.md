# Task: #04-9 - Authorization with RBAC & ACLs

> Task issues in repository from #4 to #9

## Description

This task covers the implementation of the Authorization layer, including Tenant isolation, Role-Based Access Control (RBAC), and Attribute-Based Access Control (ACLs). We will also wire these features into the web application and implement a sample resource to verify end-to-end enforcement.

## Steps

### 1. Tenant & Membership Wiring

- [ ] **Authorization and Tenant APIs + Web-app wiring**
  - [ ] Implement Tenant switching logic on the backend if applicable.
  - [ ] Wire Tenant management views in the Angular web-app.
  - [ ] Ensure API requests are scoped by `tenant_id` from the JWT/Session.
- [ ] **User <-> Tenant APIs & Web-app wiring**
  - [ ] Implement Membership management APIs (Add/Remove users from Tenants).
  - [ ] Wire User invitation/assignment flow in the web-app.
  - [ ] Implement Membership status tracking (Active/Inactive).

### 2. RBAC & ACL Implementation

- [ ] **Role <-> Tenant <-> ACLs APIs & Web-app wiring**
  - [ ] Expand `RoleService` to support custom roles per Tenant.
  - [ ] Implement the `Permission` and `RolePermission` management logic.
  - [ ] Create UI for managing Roles and assigning Permissions in the web-app.
- [ ] **Sample Resources (Scaffold version)**
  - [ ] Create a `Product` entity as a sample resource.
  - [ ] Implement CRUD APIs for Products with Tenant isolation.
  - [ ] Wire a simple Product management view in the web-app to verify access control.

### 3. Observability & Enforcement

- [ ] **Audit & Logging**
  - [ ] Ensure all authorization events (Success/Deny) are logged to the `audit_logs` table.
  - [ ] Implement an Audit Log viewer in the web-app (Admin only).
  - [ ] Wire CRUD operation logging for sample resources (Products).
- [ ] **Apply ACLs on Resources and Tests (e2e)**
  - [ ] Implement a global `RoleGuard` or `AclGuard` in NestJS.
  - [ ] Applydecorators to controllers to enforce granular actions (e.g., `READ_PRODUCTS`, `WRITE_PRODUCTS`).
  - [ ] Write e2e tests to verify that User A in Tenant A cannot access resources in Tenant B.
  - [ ] Verify that a user without the 'ADMIN' role cannot perform deletions even within their own tenant.

---

## Verifications

- [ ] Manual verification (Swagger UI (`/api/docs`)) tester: myself.
- [ ] Manual verification (Angular Dashboard components) tester: myself.
- [ ] Write real-world edge-case driven e2e tests for APIs a must.
- [ ] Write ng test for the authorization layer verification for enforcements is a must.
- [ ] All e2e tests must pass as our expectation.
