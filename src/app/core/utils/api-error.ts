function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function apiErrorStatus(error: unknown): number | null {
  if (!isRecord(error) || typeof error['status'] !== 'number') return null;
  return error['status'];
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!isRecord(error) || !isRecord(error['error'])) return fallback;
  const body = error['error'];
  const errors = body['errors'];

  if (isRecord(errors)) {
    const firstKey = Object.keys(errors)[0];
    const firstValue = firstKey ? errors[firstKey] : undefined;
    if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') return firstValue[0];
    if (typeof firstValue === 'string') return firstValue;
  }

  return typeof body['message'] === 'string' ? body['message'] : fallback;
}
