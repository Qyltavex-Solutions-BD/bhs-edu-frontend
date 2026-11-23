export function errorMessage(err: unknown, fallback: string): string {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    const anyErr = err as Record<string, unknown>;
    const data = anyErr.data as Record<string, unknown> | undefined;
    if (typeof data?.message === 'string') return data.message;
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const first = data.errors[0];
      if (typeof first?.message === 'string') return first.message;
    }
    if (typeof anyErr.message === 'string') return anyErr.message;
  }
  return fallback;
}
