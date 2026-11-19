import { afterEach, describe, expect, it, vi } from 'vitest';
import { WebPushError } from 'web-push';
import { PUSH_DEADLINE_MS, createWebPushTransport } from './web-push-transport';

const config = { publicKey: 'pub', privateKey: 'priv', subject: 'mailto:hello@example.com' };
const target = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', p256dh: 'p', auth: 'a' };
const message = { title: 'T', body: 'B', url: '/us', tag: 'turn' };

describe('createWebPushTransport', () => {
  afterEach(() => vi.useRealTimers());

  it('sends the message to the phone with the VAPID keys and a deadline', async () => {
    const send = vi.fn(async () => ({ statusCode: 201, body: '', headers: {} }));
    expect(await createWebPushTransport(config, send)(target, message)).toBe('sent');
    expect(send).toHaveBeenCalledWith(
      { endpoint: target.endpoint, keys: { p256dh: 'p', auth: 'a' } },
      JSON.stringify(message),
      expect.objectContaining({ vapidDetails: config, timeout: PUSH_DEADLINE_MS }),
    );
  });

  it('reads 404 and 410 as a phone that is gone, and throws anything else', async () => {
    const failing = (status: number) => vi.fn(async () => Promise.reject(new WebPushError('no', status, {}, '', target.endpoint)));
    expect(await createWebPushTransport(config, failing(410))(target, message)).toBe('gone');
    expect(await createWebPushTransport(config, failing(404))(target, message)).toBe('gone');
    await expect(createWebPushTransport(config, failing(500))(target, message)).rejects.toThrow();
  });

  it('gives up on a push service that never finishes answering', async () => {
    vi.useFakeTimers();
    const send = vi.fn(() => new Promise<never>(() => undefined));
    const sending = createWebPushTransport(config, send)(target, message);
    const settled = expect(sending).rejects.toThrow(/took over/);
    await vi.advanceTimersByTimeAsync(PUSH_DEADLINE_MS);
    await settled;
  });
});
