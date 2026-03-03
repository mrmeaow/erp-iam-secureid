import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AccessControlService } from '../services/access-control.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './dashboard-layout.component.html',
  styles: [`
    :host { display: block; height: 100vh; }
  `]
})
export class DashboardLayoutComponent {
  private authService = inject(AuthService);
  private accessControl = inject(AccessControlService);
  user = this.authService.currentUser;
  roles = this.accessControl.roles;

  isSidebarCollapsed = signal(false);

  menuItems = computed(() => {
    const allItems = [
      {
        label: 'Overview',
        path: '/dashboard',
        icon: 'grid_view',
        permission: 'DASHBOARD:READ',
        always: true,
      },
      {
        label: 'Tenants',
        path: '/dashboard/tenants',
        icon: 'corporate_fare',
        permission: 'TENANTS:READ'
      },
      {
        label: 'Products',
        path: '/dashboard/products',
        icon: 'inventory_2',
        permission: 'PRODUCTS:READ'
      },
      {
        label: 'Users & Teams',
        path: '/dashboard/users',
        icon: 'group',
        permission: 'USERS:READ'
      },
      {
        label: 'Roles & Permissions',
        path: '/dashboard/roles',
        icon: 'admin_panel_settings',
        permission: 'ROLES:READ'
      },
      {
        label: 'Audit Logs',
        path: '/dashboard/audit',
        icon: 'analytics',
        permission: 'AUDIT:READ'
      },
      {
        label: 'Settings',
        path: '/dashboard/settings',
        icon: 'settings',
        permission: 'SETTINGS:READ'
      },
      {
        label: 'Profile',
        path: '/dashboard/profile',
        icon: 'account_circle',
        permission: 'PROFILE:READ',
        always: true,
      },
    ];

    const user = this.user();
    const hasLoadedPermissions = !!user?.permissions?.length;

    // If permissions are not yet hydrated, keep non-destructive nav visible.
    if (!hasLoadedPermissions) {
      return allItems.filter((item) => item.always || !item.path.includes('/users'));
    }

    return allItems.filter((item) => {
      if (item.always) return true;
      const [resource, action] = item.permission.split(':');
      return this.accessControl.can(resource, action);
    });
  });

  toggleSidebar() {
    this.isSidebarCollapsed.update((v) => !v);
  }

  logout() {
    this.authService.logout();
    window.location.reload();
  }
}
