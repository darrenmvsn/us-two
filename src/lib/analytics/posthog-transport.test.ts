import { describe, expect, it, vi } from 'vitest';
import { createPostHogTransport, type AnalyticsEnvelope } from './posthog-transport';

const CONFIG = { projectToken: 'phc_test_token', host: 'https://eu.i.posthog.com' };
const ENVELOPE: AnalyticsEnvelope = {
  event: 'pack_chosen',
  distinct_id: 'v_1',
  uuid: 'd5f498ab-827a-5903-bbda-44e59f2dabbf',
  timestamp: '2026-10-22T00:00:00.000Z',
  properties: { pack: 'deep', app: 'us_two', schema_version: 1, $geoip_disable: true },
};

describe('createPostHogTransport', () => {
  it('POSTs the envelope plus the project token to {host}/i/v0/e/ with a timeout', async () => {
    const fetchImpl = vi.fn(async () => new Response('{"status":"Ok"}', { status: 200 }));
    await createPostHogTransport(CONFIG, fetchImpl as unknown as typeof fetch)(ENVELOPE);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://eu.i.posthog.com/i/v0/e/');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(init.body as string)).toEqual({ api_key: 'phc_test_token', ...ENVELOPE });
  });

  it('rejects on a non-2xx answer, naming only the status', async () => {
    const fetchImpl = vi.fn(async () => new Response('bad token', { status: 401 }));
    await expect(createPostHogTransport(CONFIG, fetchImpl as unknown as typeof fetch)(ENVELOPE)).rejects.toThrow(
      'PostHog answered 401',
    );
  });
});
