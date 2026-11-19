import { describe, expect, it } from 'vitest';
import { MAX_JSON_BYTES, isCrossSite, readJson } from './responses';

const post = (body: BodyInit | undefined, headers: Record<string, string> = {}) =>
  new Request('https://t.example/api', { method: 'POST', body, headers: { 'content-type': 'application/json', ...headers }, duplex: 'half' } as RequestInit);

async function refusal(request: Request) {
  const result = await readJson(request);
  if (result.ok) throw new Error('expected a refusal');
  return { status: result.response.status, error: (await result.response.json()).error };
}

describe('readJson', () => {
  it('parses a small JSON body', async () => {
    expect(await readJson(post('{"a":1}'))).toEqual({ ok: true, body: { a: 1 } });
  });

  it('refuses anything but JSON, and anything that does not parse', async () => {
    expect(await refusal(post('a=1', { 'content-type': 'application/x-www-form-urlencoded' }))).toEqual({ status: 415, error: 'json_only' });
    expect(await refusal(post('{'))).toEqual({ status: 400, error: 'bad_json' });
    expect(await refusal(post(undefined))).toEqual({ status: 400, error: 'bad_json' });
  });

  it('refuses a body whose declared length is over the limit before reading it', async () => {
    expect(await refusal(post('{}', { 'content-length': String(MAX_JSON_BYTES + 1) }))).toEqual({ status: 413, error: 'too_large' });
  });

  it('counts a streamed body without a length and stops past the limit', async () => {
    const chunk = new TextEncoder().encode('x'.repeat(4096));
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < 10; i += 1) controller.enqueue(chunk);
        controller.close();
      },
    });
    expect(await refusal(post(stream))).toEqual({ status: 413, error: 'too_large' });
  });

  it('refuses a request another site made, by the browser’s word', async () => {
    expect(await refusal(post('{}', { 'sec-fetch-site': 'same-site' }))).toEqual({ status: 403, error: 'cross_site' });
    expect(await readJson(post('{}', { 'sec-fetch-site': 'same-origin' }))).toEqual({ ok: true, body: {} });
  });
});

describe('isCrossSite', () => {
  const site = (value?: string) => new Request('https://t.example/api', { method: 'POST', headers: value ? { 'sec-fetch-site': value } : {} });

  it('trusts the same origin, a typed address and a browser that says nothing', () => {
    expect([site('same-origin'), site('none'), site()].map(isCrossSite)).toEqual([false, false, false]);
  });

  it('refuses a sibling subdomain and any other site', () => {
    expect([site('same-site'), site('cross-site')].map(isCrossSite)).toEqual([true, true]);
  });
});
