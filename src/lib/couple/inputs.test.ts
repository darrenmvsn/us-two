import { describe, expect, it } from 'vitest';
import { deviceLinkCodeSchema, deviceLinkForSchema, isPushServiceEndpoint, nudgeEndpointSchema, nudgeSubscriptionSchema } from './inputs';

describe('isPushServiceEndpoint', () => {
  it.each([
    'https://fcm.googleapis.com/fcm/send/abc',
    'https://updates.push.services.mozilla.com/wpush/v2/abc',
    'https://web.push.apple.com/QGx',
    'https://wns2-by3p.notify.windows.com/w/?token=abc',
  ])('accepts %s', (url) => expect(isPushServiceEndpoint(url)).toBe(true));

  it.each([
    ['plain http', 'http://fcm.googleapis.com/fcm/send/abc'],
    ['a port', 'https://fcm.googleapis.com:8443/fcm/send/abc'],
    ['another host', 'https://example.com/fcm/send/abc'],
    ['a look-alike suffix', 'https://evilfcm.googleapis.com.example.com/x'],
    ['a host ending in the name without a dot', 'https://notpush.apple.com.evil/x'],
    ['a prefix trick', 'https://evil-push.apple.com/x'],
    ['credentials before the host', 'https://fcm.googleapis.com@evil.example/x'],
    ['not a URL', 'fcm.googleapis.com/fcm/send/abc'],
    ['the empty string', ''],
  ])('refuses %s', (_, url) => expect(isPushServiceEndpoint(url)).toBe(false));
});

describe('nudgeSubscriptionSchema', () => {
  const valid = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'BNc_-x1=', auth: 'tBHI' } };

  it('accepts what PushSubscription.toJSON() sends, extra fields and all', () => {
    expect(nudgeSubscriptionSchema.safeParse({ ...valid, expirationTime: null }).success).toBe(true);
  });

  it('refuses another host with a message to show', () => {
    const parsed = nudgeSubscriptionSchema.safeParse({ ...valid, endpoint: 'https://example.com/x' });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe('This browser cannot get nudges.');
  });

  it('refuses keys that are not base64url, too long, or missing', () => {
    expect(nudgeSubscriptionSchema.safeParse({ ...valid, keys: { p256dh: 'a b', auth: 'x' } }).success).toBe(false);
    expect(nudgeSubscriptionSchema.safeParse({ ...valid, keys: { p256dh: 'a'.repeat(201), auth: 'x' } }).success).toBe(false);
    expect(nudgeSubscriptionSchema.safeParse({ endpoint: valid.endpoint }).success).toBe(false);
    expect(nudgeSubscriptionSchema.safeParse({ ...valid, endpoint: `${valid.endpoint}/${'a'.repeat(1000)}` }).success).toBe(false);
  });
});

describe('nudgeEndpointSchema', () => {
  it('takes only an endpoint', () => {
    expect(nudgeEndpointSchema.safeParse({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc' }).success).toBe(true);
    expect(nudgeEndpointSchema.safeParse({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: {} }).success).toBe(false);
    expect(nudgeEndpointSchema.safeParse({ endpoint: 'https://example.com/x' }).success).toBe(false);
  });
});

describe('device link inputs', () => {
  it('says who the link is for: me or partner, nothing else', () => {
    expect(deviceLinkForSchema.parse({ for: 'me' })).toEqual({ for: 'me' });
    expect(deviceLinkForSchema.parse({ for: 'partner' })).toEqual({ for: 'partner' });
    expect(deviceLinkForSchema.safeParse({ for: 'them' }).success).toBe(false);
    expect(deviceLinkForSchema.safeParse({ for: 'me', extra: 1 }).success).toBe(false);
  });

  it('takes a ten-character code from the invite alphabet', () => {
    expect(deviceLinkCodeSchema.safeParse({ code: 'abcdefghjk' }).success).toBe(true);
    const parsed = deviceLinkCodeSchema.safeParse({ code: 'abcdefghi1' });
    expect(parsed.error?.issues[0]?.message).toBe('That link is not right. Make a new one in Settings.');
    expect(deviceLinkCodeSchema.safeParse({ code: 'abcdefghj' }).success).toBe(false);
    expect(deviceLinkCodeSchema.safeParse({ code: 'abcdefghjk', more: true }).success).toBe(false);
  });
});
