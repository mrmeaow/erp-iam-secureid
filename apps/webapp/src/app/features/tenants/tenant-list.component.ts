import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Api } from '../../core/api/api';
import * as ApiFns from '../../core/api/functions';
import { RoleDto, TenantMembershipDto } from '../../core/api/models';
import { ApiResponseDto } from '../../core/api/models/api-response-dto';
import { HasPermissionDirective } from '../../core/directives/has-permission.directive';
import { AuthService } from '../../core/services/auth.service';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  templateUrl: './tenant-list.component.html',
})
export class TenantListComponent implements OnInit {
  private readonly api = inject(Api);
  private readonly authService = inject(AuthService);
  private readonly loading = inject(LoadingService);

  tenants = signal<TenantMembershipDto[]>([]);
  members = signal<TenantMembershipDto[]>([]);
  roles = signal<RoleDto[]>([]);
  activeTenantId = signal<string>('');

  async ngOnInit() {
    await Promise.all([this.loadTenants(), this.loadRoles()]);
    await this.loadMembers();
  }

  async loadTenants() {
    this.loading.show();
    try {
      const response = (await this.api.invoke(
        ApiFns.tenantControllerGetMyTenantsV1,
        {},
      )) as unknown as ApiResponseDto;
      if (response.success && response.data) {
        this.tenants.set(response.data as unknown as TenantMembershipDto[]);
        const current = this.authService.currentUser()?.tenantId;
        if (current) {
          this.activeTenantId.set(current);
        }
      }
    } finally {
      this.loading.hide();
    }
  }

  async loadRoles() {
    this.loading.show();
    try {
      const response = (await this.api.invoke(
        ApiFns.roleControllerGetRolesV1,
        {},
      )) as unknown as ApiResponseDto;
      if (response.success && response.data) {
        const data = response.data as unknown as RoleDto[];
        this.roles.set(data);
      }
    } finally {
      this.loading.hide();
    }
  }

  async loadMembers() {
    this.loading.show();
    try {
      const response = (await this.api.invoke(
        ApiFns.tenantControllerGetMembersV1,
        {},
      )) as unknown as ApiResponseDto;
      if (response.success && response.data) {
        this.members.set(response.data as unknown as TenantMembershipDto[]);
      }
    } finally {
      this.loading.hide();
    }
  }

  async switchTenant(tenantId: string) {
    this.loading.show();
    try {
      const response = (await this.api.invoke(ApiFns.tenantControllerSwitchTenantV1, {
        tenantId,
      })) as unknown as ApiResponseDto;

      const data: any = response?.data;
      if (response?.success && data?.accessToken && data?.refreshToken) {
        localStorage.setItem('auth_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        this.activeTenantId.set(tenantId);
        await this.authService.getMe();
        await Promise.all([this.loadRoles(), this.loadMembers()]);
      }
    } finally {
      this.loading.hide();
    }
  }

  async removeMember(userId: string) {
    this.loading.show();
    try {
      await this.api.invoke(ApiFns.tenantControllerRemoveMemberV1, { userId });
      await this.loadMembers();
    } finally {
      this.loading.hide();
    }
  }

  async assignMemberRole(userId: string, roleId: string) {
    if (!roleId) return;
    this.loading.show();
    try {
      await this.api.invoke(ApiFns.tenantControllerAddMemberV1, {
        body: { user_id: userId, role_id: roleId },
      });
      await this.loadMembers();
    } finally {
      this.loading.hide();
    }
  }
}
