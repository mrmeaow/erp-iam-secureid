import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Api } from '../../core/api/api';
import * as AuditLogApi from '../../core/api/functions';
import { ApiResponseDto } from '../../core/api/models/api-response-dto';
import { AuditLogDto } from '../../core/api/models/audit-log-dto';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-log.component.html',
})
export class AuditLogComponent implements OnInit {
  private readonly api = inject(Api);
  private readonly loading = inject(LoadingService);

  logs = signal<AuditLogDto[]>([]);

  async ngOnInit() {
    await this.loadLogs();
  }

  async loadLogs() {
    this.loading.show();
    try {
      const response = (await this.api.invoke(
        AuditLogApi.auditLogControllerFindAllV1,
        {},
      )) as unknown as ApiResponseDto;
      if (response && response.success && response.data) {
        this.logs.set(response.data as unknown as AuditLogDto[]);
      }
    } catch (e) {
      console.error('Failed to load audit logs', e);
    } finally {
      this.loading.hide();
    }
  }

  formatAction(action: string): string {
    if (!action) return 'N/A';
    return action.replace(/_/g, ' ');
  }

  getStatusClass(status: string): string {
    const normalized = (status || '').toUpperCase();
    if (normalized.includes('FAIL')) {
      return 'text-red-700 bg-red-50 border-red-200';
    }
    if (normalized.includes('SUCCESS')) {
      return 'text-green-700 bg-green-50 border-green-200';
    }
    return 'text-primary-700 bg-primary-50 border-primary-200';
  }

  getStatusLabel(log: AuditLogDto): string {
    const action = String(log?.action || '').toUpperCase();
    if (action.includes('FAILURE')) return 'FAILURE';
    if (action.includes('SUCCESS')) return 'SUCCESS';
    return 'INFO';
  }
}
