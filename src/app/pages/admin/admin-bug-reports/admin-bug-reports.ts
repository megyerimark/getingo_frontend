import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  AdminBugReport,
  AdminBugReportStatus
} from '../../../core/models/admin-bug-report.model';

import {
  AdminBugReportService
} from '../../../services/admin-bug-report';

@Component({
  selector: 'app-admin-bug-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './admin-bug-reports.html',
  styleUrl: './admin-bug-reports.scss'
})
export class AdminBugReports implements OnInit {
  private readonly bugReportService = inject(AdminBugReportService);

  reports: AdminBugReport[] = [];
  selected: AdminBugReport | null = null;

  loading = false;
  detailLoading = false;
  saving = false;

  search = '';
  status = '';
  priority = '';
  type = '';
  unreadOnly = false;

  page = 1;
  lastPage = 1;
  total = 0;

  ngOnInit(): void {
    this.load();
  }

  load(page = 1): void {
    if (page < 1) {
      return;
    }

    this.loading = true;

    this.bugReportService
      .getAll({
        search: this.search.trim(),
        status: this.status,
        priority: this.priority,
        type: this.type,
        unread: this.unreadOnly,
        page
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: response => {
          this.reports = response.data;
          this.page = response.current_page;
          this.lastPage = response.last_page;
          this.total = response.total;

          if (
            this.selected &&
            !this.reports.some(report => report.id === this.selected?.id)
          ) {
            this.selected = null;
          }
        },
        error: error => {
          console.error('Hibajelentések betöltési hiba:', error);

          this.reports = [];
          this.total = 0;
        }
      });
  }

  open(report: AdminBugReport): void {
    if (this.detailLoading) {
      return;
    }

    this.detailLoading = true;

    this.bugReportService
      .getOne(report.id)
      .pipe(
        finalize(() => {
          this.detailLoading = false;
        })
      )
      .subscribe({
        next: response => {
          this.selected = response.report;

          const index = this.reports.findIndex(
            item => item.id === report.id
          );

          if (index !== -1) {
            this.reports[index] = {
              ...this.reports[index],
              ...response.report
            };
          }
        },
        error: error => {
          console.error('Hibajelentés megnyitási hiba:', error);
        }
      });
  }

  closeDetail(): void {
    this.selected = null;
  }

  updateStatus(status: AdminBugReportStatus): void {
    if (!this.selected || this.saving) {
      return;
    }

    if (this.selected.status === status) {
      return;
    }

    this.saving = true;

    this.bugReportService
      .updateStatus(
        this.selected.id,
        status
      )
      .pipe(
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe({
        next: response => {
          this.selected = {
            ...this.selected!,
            ...response.report
          };

          const index = this.reports.findIndex(
            report => report.id === response.report.id
          );

          if (index !== -1) {
            this.reports[index] = {
              ...this.reports[index],
              ...response.report
            };
          }
        },
        error: error => {
          console.error(
            'Hibajelentés státusz módosítási hiba:',
            error
          );
        }
      });
  }

  markAllSeen(): void {
    this.bugReportService
      .markAllSeen()
      .subscribe({
        next: () => {
          const now = new Date().toISOString();

          this.reports = this.reports.map(report => ({
            ...report,
            seen_at: report.seen_at ?? now
          }));

          if (this.selected) {
            this.selected = {
              ...this.selected,
              seen_at: this.selected.seen_at ?? now
            };
          }
        },
        error: error => {
          console.error(
            'Olvasottnak jelölési hiba:',
            error
          );
        }
      });
  }

  resetFilters(): void {
    this.search = '';
    this.status = '';
    this.priority = '';
    this.type = '';
    this.unreadOnly = false;

    this.selected = null;

    this.load(1);
  }

  screenshotUrl(report: AdminBugReport): string {
    return this.bugReportService.screenshotUrl(report.id);
  }

  typeLabel(type: AdminBugReport['type']): string {
    switch (type) {
      case 'ui':
        return 'Felületi hiba';

      case 'function':
        return 'Funkcionális hiba';

      case 'performance':
        return 'Teljesítmény';

      case 'other':
      default:
        return 'Egyéb';
    }
  }

  priorityLabel(priority: AdminBugReport['priority']): string {
    switch (priority) {
      case 'high':
        return 'Magas';

      case 'medium':
        return 'Közepes';

      case 'low':
        return 'Alacsony';

      default:
        return priority;
    }
  }

  statusLabel(status: AdminBugReportStatus): string {
    switch (status) {
      case 'new':
        return 'Új';

      case 'in_progress':
        return 'Folyamatban';

      case 'resolved':
        return 'Megoldva';

      case 'closed':
        return 'Lezárva';

      default:
        return status;
    }
  }
}