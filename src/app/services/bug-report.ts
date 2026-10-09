import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


import {
  BugReportPriority,
  BugReportResponse,
  BugReportType,
} from '../core/models/bug-report.model';

@Injectable({
  providedIn: 'root',
})
export class BugReportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  create(data: {
    title: string;
    description: string;
    type: BugReportType;
    priority: BugReportPriority;
    pageUrl: string;
    browser: string;
    platform: string;
    screenshot?: File | null;
  }): Observable<BugReportResponse> {
    const formData = new FormData();

    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('type', data.type);
    formData.append('priority', data.priority);
    formData.append('page_url', data.pageUrl);
    formData.append('browser', data.browser);
    formData.append('platform', data.platform);

    if (data.screenshot) {
      formData.append(
        'screenshot',
        data.screenshot,
        data.screenshot.name
      );
    }

    return this.http.post<BugReportResponse>(
      `${this.apiUrl}/bug-reports`,
      formData,
      {
        withCredentials: true,
      }
    );
  }
}