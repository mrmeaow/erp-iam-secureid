# Web (Angular) Rules

## Checklist

- Follow latest angular zoneless v21 standards.
- Follow angular signals for state management strictly.
- Use `HttpClient` for API calls and handle responses using `rxjs` operators for better error handling and async operations.
- Use latest `tailwindcss` v4 for styling and UI components.
- Must follow our `pnpm-workspace` structure and rules as per monorepo.
- Must sync with auto-generated API SDKs using our backend `openapi.json`.
- Must follow latest modern angular APIs e.g. `@if`, `@for`, `@switch`, etc. instead of `*ngIf`, `*ngFor`, `*ngSwitch`, etc.

- Mulitple layouts support e.g. `dashboard`, `auth-pages`, in generel public landing page or pages etc. and must be able to switch between them easily.
- Must use client-side level routing and guards for route protection.
- Must use form-validations with prorper error messages.
- Must use semantic design language with modern elegent UI/UX.
- Must use responsive design for mobile, tablet, and desktop as per tailwindcss ways.
- Must use accessibility standards for web applications.
- Must use proper loading states and error handling for API calls.
- Must follow SPA (Single Page Application) standards.
- NEVER get our of DRY, KISS, YAGNI, SOLID, and other software engineering principles.
- Must follow angular component standards and use components for reusability and maintainability.
- Must follow a consistent design language and UI/UX standards with colors and dark vs light mode support.
- Must follow a consistent naming convention for components, services, and other files.
- Must follow a consistent folder structure for components, services, and other files.
- Must have modern and elegent toast notifications for success, error, and warning messages.

## Dashboard Specification

- Dashboard pages are only accessible for the authenticated users.
- Sidebar menu items are dynamically generated based on the user's roles and permissions and their ACLs.
- Key actions e.g. create, update, delete, view, etc. are also dynamically generated based on the user's roles and permissions and their ACL data.
- Each key element to components should be planned and used with proper consideration of our rules and standards.
- Must follow a industry enterprise level standards for the UI design and its UX flow.
- Must have a proper loading states and error handling for API calls.
- Must have left sidebar, top navigation bar, and main content area.
- Must have a proper responsive design for mobile, tablet, and desktop as per tailwindcss ways.
- Must have standard table component with pagination, sorting, filtering, and searching capabilities on demand.
- Must have a modern & elegent UI.UX for modals / popups, sidebars, forms, buttons, and other UI elements.
