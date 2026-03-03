import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './core/components/auth-layout.component';
import { DashboardLayoutComponent } from './core/components/dashboard-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent,
          ),
      },
      {
        path: 'verify-email',
        loadComponent: () =>
          import('./features/auth/verify-email/verify-email.component').then(
            (m) => m.VerifyEmailComponent,
          ),
      },
    ],
  },
  {
    path: 'dashboard',
    component: DashboardLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/product-list.component').then((m) => m.ProductListComponent),
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import('./features/tenants/tenant-list.component').then((m) => m.TenantListComponent),
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./features/roles/role-list.component').then((m) => m.RoleListComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/user-list.component').then((m) => m.UserListComponent),
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./features/audit/audit-log.component').then((m) => m.AuditLogComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/change-password/change-password.component').then(
            (m) => m.ChangePasswordComponent,
          ),
      },
      // Future routes like users, roles, etc. will go here
    ],
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];
