import { describe, expect, it } from 'vitest';
import nextConfig from '../../next.config';

async function headersFor(source: string) {
  const rules = (await nextConfig.headers?.()) ?? [];
  return Object.fromEntries(rules.filter((rule) => rule.source === source).flatMap((rule) => rule.headers.map((h) => [h.key, h.value])));
}

describe('security headers', () => {
  it('sends the headers on every response, refusing frames and other origins', async () => {
    const all = await headersFor('/(.*)');
    expect(all['X-Frame-Options']).toBe('DENY');
    expect(all['X-Content-Type-Options']).toBe('nosniff');
    expect(all['Strict-Transport-Security']).toMatch(/max-age=\d+/);
    expect(all['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(all['Permissions-Policy']).toContain('camera=()');
    const csp = all['Content-Security-Policy'];
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("connect-src 'self';");
    expect(csp).toContain("object-src 'none'");
    // canvas-confetti draws in a worker started from a blob: URL.
    expect(csp).toContain("worker-src 'self' blob:");
  });

  it('keeps the service worker fresh and on its own tighter policy', async () => {
    const sw = await headersFor('/sw.js');
    expect(sw['Cache-Control']).toBe('no-cache');
    expect(sw['Content-Type']).toBe('application/javascript; charset=utf-8');
    expect(sw['Content-Security-Policy']).toBe("default-src 'self'; script-src 'self'");
  });

  it('names no framework in its answers', () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
