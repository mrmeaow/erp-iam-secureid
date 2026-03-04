import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Api } from '../../core/api/api';
import * as ApiFns from '../../core/api/functions';
import { RoleDto, TenantMembershipDto } from '../../core/api/models';
import { ApiResponseDto } from '../../core/api/models/api-response-dto';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit {
  private readonly api = inject(Api);
  private readonly loading = inject(LoadingService);

  members = signal<TenantMembershipDto[]>([]);
  roles = signal<RoleDto[]>([]);
  inviteEmail = signal<string>('');
  inviteRoleId = signal<string>('');

  async ngOnInit() {
    await Promise.all([this.loadMembers(), this.loadRoles()]);
  }

  setInviteEmail(value: string) {
    this.inviteEmail.set(value);
  }

  setInviteRoleId(value: string) {
    this.inviteRoleId.set(value);
  }

  async sendInvite() {
    const email = this.inviteEmail().trim();
    const role_id = this.inviteRoleId();
    if (!email || !role_id) return;

    this.loading.show();
    try {
      await this.api.invoke(ApiFns.invitationControllerSendInviteV1, {
        body: { email, role_id },
      });
      this.inviteEmail.set('');
      await this.loadMembers();
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

  async loadRoles() {
    this.loading.show();
    try {
      const response = (await this.api.invoke(
        ApiFns.roleControllerGetRolesV1,
        {},
      )) as unknown as ApiResponseDto;
      if (response.success && response.data) {
        this.roles.set(response.data as unknown as RoleDto[]);
      }
    } finally {
      this.loading.hide();
    }
  }

  async removeMember(userId: string) {
    if (!confirm('Remove this member from current tenant?')) return;

    this.loading.show();
    try {
      await this.api.invoke(ApiFns.tenantControllerRemoveMemberV1, { userId });
      await this.loadMembers();
    } finally {
      this.loading.hide();
    }
  }

  async assignRole(userId: string, roleId: string) {
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
