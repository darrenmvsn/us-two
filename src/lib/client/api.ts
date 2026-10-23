/**
 * The browser's side of the API: JSON in, `{ ok, data }` or `{ ok: false,
 * message }` out, where the message is ready to show.
 */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string; message: string };

const FALLBACK = 'Something went wrong. Check your connection and try again.';

export async function callApi<T = null>(path: string, init: { method: string; body?: unknown } = { method: 'GET' }): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: init.method,
      headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: 'no-store',
    });
  } catch {
    return { ok: false, status: 0, error: 'network', message: FALLBACK };
  }
  if (response.status === 204) return { ok: true, data: null as T };
  const json = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (response.ok) return { ok: true, data: json as T };
  return {
    ok: false,
    status: response.status,
    error: typeof json?.error === 'string' ? json.error : 'unknown',
    message: typeof json?.message === 'string' ? json.message : FALLBACK,
  };
}

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
