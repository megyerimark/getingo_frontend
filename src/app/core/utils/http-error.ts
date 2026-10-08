import { HttpErrorResponse } from '@angular/common/http';

interface ApiValidationErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  const body = isApiValidationErrorBody(error.error) ? error.error : null;
  if (body?.errors) {
    const firstKey = Object.keys(body.errors)[0];
    const firstMessage = firstKey ? body.errors[firstKey]?.[0] : undefined;
    if (firstMessage) return firstMessage;
  }
  return body?.message ?? fallback;
}

export function apiErrorStatus(error: unknown): number | null {
  return error instanceof HttpErrorResponse ? error.status : null;
}

function isApiValidationErrorBody(value: unknown): value is ApiValidationErrorBody {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  const messageValid = record['message'] === undefined || typeof record['message'] === 'string';
  const errors = record['errors'];
  const errorsValid = errors === undefined || (
    typeof errors === 'object' && errors !== null && Object.values(errors).every(item =>
      Array.isArray(item) && item.every(entry => typeof entry === 'string')
    )
  );
  return messageValid && errorsValid;
}
