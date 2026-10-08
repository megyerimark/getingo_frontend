import { Component } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuditLog } from '../../../core/models/admin.model';
import { AdminService } from '../../../services/admin';
import { ToastService } from '../../../services/toast';

@Component({
  selector: 'app-admin-audit-logs',
  imports: [DatePipe, JsonPipe, FormsModule],
  templateUrl: './admin-audit-logs.html',
  styleUrl: './admin-audit-logs.scss'
})
export class AdminAuditLogs {
  logs: AuditLog[] = [];
  password = '';
  token = '';
  unlocking = false;
  loading = false;
  exporting = false;
  search = '';
  action = '';
  from = '';
  to = '';

  constructor(private adminService: AdminService, private toast: ToastService) {}

  unlock(): void {
    if (!this.password || this.unlocking) return;
    this.unlocking = true;
    this.adminService.unlockSensitive(this.password).pipe(finalize(() => this.unlocking = false)).subscribe({
      next: response => {
        this.token = response.token;
        this.password = '';
        this.toast.success(response.message);
        this.load();
      },
      error: err => this.toast.error(err?.error?.message ?? 'A feloldás nem sikerült.')
    });
  }

  load(): void {
    if (!this.token) return;
    this.loading = true;
    this.adminService.getAuditLogs(this.token, this.filters()).pipe(finalize(() => this.loading = false)).subscribe({
      next: logs => this.logs = logs,
      error: err => {
        if (err?.status === 423) this.token = '';
        this.toast.error(err?.error?.message ?? 'Az audit napló nem tölthető be.');
      }
    });
  }

  resetFilters(): void { this.search = ''; this.action = ''; this.from = ''; this.to = ''; this.load(); }

  export(): void {
    if (!this.token || this.exporting) return;
    this.exporting = true;
    this.adminService.exportAuditLogs(this.token, this.filters()).pipe(finalize(() => this.exporting = false)).subscribe({
      next: blob => this.download(blob, `getingo-audit-${new Date().toISOString().slice(0,10)}.csv`),
      error: err => {
        if (err?.status === 423) this.token = '';
        this.toast.error('Az audit export nem sikerült.');
      }
    });
  }

  private filters() { return { search: this.search, action: this.action, from: this.from, to: this.to }; }
  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }
}
