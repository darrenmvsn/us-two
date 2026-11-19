/**
 * Per-client fixed-window limits for the public API. In memory, per process:
 * a restart (or, on Vercel, each instance) starting the windows afresh is
 * acceptable: every write is scoped to the caller's own couple, and the
 * codes a script could guess are 31^10 to one.
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
 * The caller's address as the proxy in front forwards it: Caddy (the Oracle
 * kit) and Vercel both overwrite X-Forwarded-For with the client's address,
 * so the first entry cannot be chosen by the caller. Without a proxy (local
 * dev) all callers share one bucket. An IPv6 caller is keyed by its /64, the
 * block one connection is given, so rotating addresses inside it buys no
 * more requests.
 */
export function clientKey(request: Request): string {
  return clientKeyFromHeaders(request.headers);
}

/** The same key from a header list, for server components (`next/headers`). */
export function clientKeyFromHeaders(headers: Pick<Headers, 'get'>): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwarded || headers.get('x-real-ip')?.trim();
  return address ? addressBucket(address) : 'local';
}

/**
 * An IPv4 address as it is; an IPv6 one as its /64 (`2001:db8:0:1::/64`),
 * with an IPv4-mapped one (`::ffff:1.2.3.4`) read as the IPv4 inside it.
 * Anything that does not parse is kept whole.
 */
export function addressBucket(address: string): string {
  if (!address.includes(':')) return address;
  const bare = address.replace(/^\[|\]$/g, '').replace(/%.*$/, '').toLowerCase();
  const groups = ipv6Groups(bare);
  if (!groups) return address;
  if (groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff) {
    return [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff].join('.');
  }
  return `${groups.slice(0, 4).map((group) => group.toString(16)).join(':')}::/64`;
}

/** The eight 16-bit groups of an IPv6 address, `::` and a dotted IPv4 tail expanded; null when it is not one. */
function ipv6Groups(address: string): number[] | null {
  const halves = address.split('::');
  if (halves.length > 2) return null;
  const parse = (part: string): number[] | null => {
    if (part === '') return [];
    const groups: number[] = [];
    const pieces = part.split(':');
    for (const [i, piece] of pieces.entries()) {
      const dotted = i === pieces.length - 1 && /^\d{1,3}(\.\d{1,3}){3}$/.test(piece) ? piece.split('.').map(Number) : null;
      if (dotted) {
        if (dotted.some((octet) => octet > 255)) return null;
        groups.push((dotted[0] << 8) | dotted[1], (dotted[2] << 8) | dotted[3]);
      } else if (/^[0-9a-f]{1,4}$/.test(piece)) groups.push(parseInt(piece, 16));
      else return null;
    }
    return groups;
  };
  const head = parse(halves[0]);
  const tail = halves.length === 2 ? parse(halves[1]) : [];
  if (!head || !tail) return null;
  if (halves.length === 1) return head.length === 8 ? head : null;
  const missing = 8 - head.length - tail.length;
  return missing >= 1 ? [...head, ...Array<number>(missing).fill(0), ...tail] : null;
}
