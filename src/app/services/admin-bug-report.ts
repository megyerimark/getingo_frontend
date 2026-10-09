import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

import {
  AdminBugReport,
  AdminBugReportListResponse,
  AdminBugReportStatus,
} from '../core/models/admin-bug-report.model';

@Injectable({
  providedIn: 'root',
})
export class AdminBugReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin/bug-reports`;

  getAll(filters?: {
    search?: string;
    status?: string;
    priority?: string;
    type?: string;
    unread?: boolean;
    page?: number;
  }): Observable<AdminBugReportListResponse> {
    let params = new HttpParams();

    if (filters?.search) {
      params = params.set('search', filters.search);
    }

    if (filters?.status) {
      params = params.set('status', filters.status);
    }

    if (filters?.priority) {
      params = params.set('priority', filters.priority);
    }

    if (filters?.type) {
      params = params.set('type', filters.type);
    }

    if (filters?.unread) {
      params = params.set('unread', '1');
    }

    if (filters?.page) {
      params = params.set('page', filters.page);
    }

    return this.http.get<AdminBugReportListResponse>(
      this.apiUrl,
      {
        params,
        withCredentials: true,
      }
    );
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(
      `${this.apiUrl}/unread-count`,
      {
        withCredentials: true,
      }
    );
  }

  getOne(id: number): Observable<{ report: AdminBugReport }> {
    return this.http.get<{ report: AdminBugReport }>(
      `${this.apiUrl}/${id}`,
      {
        withCredentials: true,
      }
    );
  }

  updateStatus(
    id: number,
    status: AdminBugReportStatus
  ): Observable<{
    message: string;
    report: AdminBugReport;
  }> {
    return this.http.patch<{
      message: string;
      report: AdminBugReport;
    }>(
      `${this.apiUrl}/${id}`,
      { status },
      {
        withCredentials: true,
      }
    );
  }

  markAllSeen(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/mark-all-seen`,
      {},
      {
        withCredentials: true,
      }
    );
  }

  screenshotUrl(id: number): string {
    return `${this.apiUrl}/${id}/screenshot`;
  }
}