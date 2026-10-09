export type BugReportType =
  | 'ui'
  | 'function'
  | 'performance'
  | 'other';

export type BugReportPriority =
  | 'low'
  | 'medium'
  | 'high';

export interface BugReportResponse {
  message: string;

  report: {
    id: number;
    status: string;
    created_at: string;
  };
}