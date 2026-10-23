/**
 * Per-client fixed-window limits for the public API. In memory, per process:
 * the app runs as one container, and every route is a read that costs only
 * upstream quota, so a restart resetting the windows is acceptable.
 */
export interface RateLimiter {
  /** Admits a request costing `cost` units (1 by default) whole, or refuses it whole. */
  allow(key: string, cost?: number): boolean;
}

export function createFixedWindowLimiter(opts: { limit: number; windowMs: number; now?: () => number }): RateLimiter {
  const now = opts.now ?? Date.now;
  const windows = new Map<string, { start: number; count: number }>();
  return {
    allow(key, cost = 1) {
      const t = now();
      const entry = windows.get(key);
      if (!entry || t - entry.start >= opts.windowMs) {
        // Drop only expired windows: clearing them all would let a client
        // rotating addresses reset everyone's limit.
        if (windows.size > 10_000) for (const [k, w] of windows) if (t - w.start >= opts.windowMs) windows.delete(k);
        windows.set(key, { start: t, count: cost });
        return cost <= opts.limit;
      }
      entry.count += cost;
      return entry.count <= opts.limit;
    },
  };
}

/**
 * The caller's address as Caddy forwards it. Caddy sets X-Forwarded-For with
 * the client as the first entry; without a proxy (local dev) all callers
 * share one bucket.
 */
export function clientKey(request: Request): string {
  return clientKeyFromHeaders(request.headers);
}

/** The same key from a header list, for server components (`next/headers`). */
export function clientKeyFromHeaders(headers: Pick<Headers, 'get'>): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip') || 'local';
}

/**
 * Uses per client per UTC day (the same day the shared AI cap resets on),
 * with `refund` for a use that bought nothing: a call the provider failed.
 */
export interface DailyAllowance {
  take(key: string): boolean;
  refund(key: string): void;
}

export function createDailyAllowance(opts: { limit: number; now?: () => Date }): DailyAllowance {
  const now = opts.now ?? (() => new Date());
  let day = '';
  const used = new Map<string, number>();
  const today = () => {
    const current = now().toISOString().slice(0, 10);
    if (current !== day) {
      day = current;
      used.clear();
    }
  };
  return {
    take(key) {
      today();
      const count = used.get(key) ?? 0;
      if (count >= opts.limit) return false;
      used.set(key, count + 1);
      return true;
    },
    refund(key) {
      today();
      const count = used.get(key) ?? 0;
      if (count > 0) used.set(key, count - 1);
    },
  };
}
