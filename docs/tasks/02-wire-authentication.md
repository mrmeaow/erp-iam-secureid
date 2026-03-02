# Task: #2 - Wire Authentication

## Description

Time to add authentication APIs and wire them up with the web-app. API first approach and wire up with web-app after API is ready and confirmed working as expected.

## Steps

> Must follow or revise the api-rules first located at `docs/rules/api.md`. and `docs/rules/web.md`.

### API

- [x] **Prepare first**
  - [x] Database schema for users, tenants, roles, permissions, audit-logs, and more according to our `docs/plan-draft-1.md`. For now, we are concern about the authentication related stuff only, keep the rest for next task iterations.
  - [x] Setup TypeORM `@nestjs/typeorm` module for postgresql connection on demand.
  - [x] Setup @nestjs/jwt module for jwt token using our local-generated `keys` (RS256 key-pair).
  - [x] NEVER use `@nestjs/passport` or `passport.js` stuff, We want to implement it ourselves following nest.js middleware pattern with platform-fastify.

- [x] **Add authentication APIs.**
  - [x] Add JWT with `jti` (redis session) using node.js crypto random hex-value.
  - [x] Add device management for multi-device login support and restrictions on demand.
  - [x] Add `register`, `login`, `logout`, `refresh` (uses refresh-token), `change-password`, `forgot-password`, `reset-password` and `verify-email` etc. APIs that are needed for basic authentication operations.
  - [x] Add `me` or `whoami` APIs to get current user info (Later will be extended with user-profile & ACL data).

### Web-app

> Don't start this part unless the API is ready or confirmed

- [x] **Prepare first**
  - [x] Setup angular web-app foundation e.g. tailwindcss, layouts, required-components, etc.
  - [x] Setup auth-pages e.g. login, register, forgot-password, reset-password, verify-email, etc.
  - [x] Pull/Fetch backend OPENAPI json & generate angular client code/api-sdk.
  - [x] Setup angular http-client with interceptors for jwt token & error handling.
  - [x] Setup angular guards for authentication & route protection.

- [x] **Add authentication web-app.**
  - [x] Wire auth-pages with auth APIs.
  - [x] Wire guards with auth APIs.
  - [x] Wire http-client with auth APIs.
  - [x] Wire me/whoami APIs with auth APIs.
  - [x] Wire device management APIs with auth APIs (if api had it)
  - [x] Wire refresh-token APIs with auth APIs.
  - [x] Wire change-password APIs with auth APIs.
  - [x] Wire forgot-password APIs with auth APIs.
  - [x] Wire reset-password APIs with auth APIs.
  - [x] Wire verify-email APIs with auth APIs.
  - [x] Wire the dashboard gates and initial scaffold views.

---

## Verifications

> T.B.D
