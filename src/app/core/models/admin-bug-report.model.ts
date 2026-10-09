export type AdminBugReportStatus =
  | 'new'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export type AdminBugReportType =
  | 'ui'
  | 'function'
  | 'performance'
  | 'other';

export type AdminBugReportPriority =
  | 'low'
  | 'medium'
  | 'high';

export interface AdminBugReportUser {
  id: number;
  name: string;
  email: string;
}

export interface AdminBugReport {
  id: number;

  user_id: number | null;

  title: string;
  description: string;

  type: AdminBugReportType;

  priority: AdminBugReportPriority;

  page_url: string | null;
  browser: string | null;
  platform: string | null;

  screenshot: string | null;

  status: AdminBugReportStatus;

  seen_at: string | null;

  created_at: string;
  updated_at: string;

  user: AdminBugReportUser | null;
}

export interface AdminBugReportListResponse {
  data: AdminBugReport[];

  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}