import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Api } from '../../core/api/api';
import * as ApiFns from '../../core/api/functions';
import { ApiResponseDto } from '../../core/api/models/api-response-dto';
import { LoadingService } from '../../core/services/loading.service';

interface PermissionItem {
  permission_id: string;
  resource: string;
  action: string;
  label?: string;
  group?: string;
}

interface RoleItem {
  role_id: string;
  name: string;
  permissions?: PermissionItem[];
}

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './role-list.component.html',
})
export class RoleListComponent implements OnInit {
  private readonly api = inject(Api);
  private readonly loading = inject(LoadingService);

  roles = signal<RoleItem[]>([]);
  permissions = signal<PermissionItem[]>([]);
  selectedRoleId = signal<string>('');
  selectedPermissionIds = signal<string[]>([]);
  newRoleName = signal<string>('');

  async ngOnInit() {
    await Promise.all([this.loadRoles(), this.loadPermissions()]);
  }

  async loadRoles() {
    this.loading.show();
    try {
      const response = (await this.api.invoke(
        ApiFns.roleControllerGetRolesV1,
        {},
      )) as unknown as ApiResponseDto;
      if (response?.success && Array.isArray(response.data)) {
        this.roles.set(response.data as RoleItem[]);
        const firstRoleId = this.roles()[0]?.role_id;
        if (firstRoleId && !this.selectedRoleId()) {
          this.selectRole(firstRoleId);
        }
      }
    } finally {
      this.loading.hide();
    }
  }

  async loadPermissions() {
    this.loading.show();
    try {
      const response = (await this.api.invoke(
        ApiFns.permissionControllerFindAllV1,
        {},
      )) as unknown as ApiResponseDto;
      if (response?.success && Array.isArray(response.data)) {
        this.permissions.set(response.data as PermissionItem[]);
      }
    } finally {
      this.loading.hide();
    }
  }

  selectRole(roleId: string) {
    this.selectedRoleId.set(roleId);
    const role = this.roles().find((r) => r.role_id === roleId);
    this.selectedPermissionIds.set(
      (role?.permissions || []).map((p) => p.permission_id),
    );
  }

  togglePermission(permissionId: string) {
    const selected = this.selectedPermissionIds();
    if (selected.includes(permissionId)) {
      this.selectedPermissionIds.set(selected.filter((id) => id !== permissionId));
      return;
    }
    this.selectedPermissionIds.set([...selected, permissionId]);
  }

  setRoleName(name: string) {
    this.newRoleName.set(name);
  }

  async createRole() {
    const name = this.newRoleName().trim();
    if (!name) return;

    this.loading.show();
    try {
      await this.api.invoke(ApiFns.roleControllerCreateRoleV1, {
        body: { name },
      });
      this.newRoleName.set('');
      await this.loadRoles();
    } finally {
      this.loading.hide();
    }
  }

  async savePermissions() {
    const roleId = this.selectedRoleId();
    if (!roleId) return;

    this.loading.show();
    try {
      await this.api.invoke(ApiFns.roleControllerAssignPermissionsV1, {
        role_id: roleId,
        body: { permission_ids: this.selectedPermissionIds() },
      });
      await this.loadRoles();
      this.selectRole(roleId);
    } finally {
      this.loading.hide();
    }
  }
}
