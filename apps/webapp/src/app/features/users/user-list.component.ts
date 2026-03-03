import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Api } from '../../core/api/api';
import * as ApiFns from '../../core/api/functions';
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
  private readonly http = inject(HttpClient);
  private readonly loading = inject(LoadingService);

  members = signal<any[]>([]);
  roles = signal<any[]>([]);

  async ngOnInit() {
    await Promise.all([this.loadMembers(), this.loadRoles()]);
  }

  async loadMembers() {
    this.loading.show();
    try {
      const response = (await this.api.invoke(
        ApiFns.tenantControllerGetMembersV1,
        {},
      )) as unknown as ApiResponseDto;
      if (response.success) {
        this.members.set(response.data as any[]);
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
      if (response.success) {
        this.roles.set(response.data as any[]);
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
      await firstValueFrom(
        this.http.post<ApiResponseDto>(`${this.api.rootUrl}/v1/tenants/members`, {
          user_id: userId,
          role_id: roleId,
        }),
      );
      await this.loadMembers();
    } finally {
      this.loading.hide();
    }
  }
}
