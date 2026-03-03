import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Api } from '../../core/api/api';
import { ApiResponseDto } from '../../core/api/models/api-response-dto';
import { LoadingService } from '../../core/services/loading.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audit-log.component.html',
})
export class AuditLogComponent implements OnInit {
  private readonly api = inject(Api);
  private readonly http = inject(HttpClient);
  private readonly loading = inject(LoadingService);

  logs = signal<any[]>([]);

  async ngOnInit() {
    await this.loadLogs();
  }

  async loadLogs() {
    this.loading.show();
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponseDto>(`${this.api.rootUrl}/v1/audit-logs`),
      );
      if (response && response.success) {
        this.logs.set(response.data as any[]);
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

  getStatusLabel(log: any): string {
    const action = String(log?.action || '').toUpperCase();
    if (action.includes('FAILURE')) return 'FAILURE';
    if (action.includes('SUCCESS')) return 'SUCCESS';
    return 'INFO';
  }
}
