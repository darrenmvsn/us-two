import { beforeEach, describe, expect, it, vi } from 'vitest';

const turnOnNudges = vi.fn();
const turnOffNudges = vi.fn();
const currentPlayer = vi.fn();
const nudgePublicKey = vi.fn();
vi.mock('@/lib/nudges/subscriptions', () => ({
  turnOnNudges: (...args: unknown[]) => turnOnNudges(...args),
  turnOffNudges: (...args: unknown[]) => turnOffNudges(...args),
}));
vi.mock('@/lib/nudges/nudge-config', () => ({ nudgePublicKey: () => nudgePublicKey() }));
vi.mock('@/lib/http/player-session', () => ({ currentPlayer: () => currentPlayer() }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const { POST, DELETE } = await import('./route');

let ip = 0;
function request(method: 'POST' | 'DELETE', body: unknown, contentType = 'application/json', address?: string) {
  ip += 1;
  return new Request('http://test/api/us/nudges', {
    method,
    headers: { 'content-type': contentType, 'x-forwarded-for': address ?? `10.5.0.${ip}` },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const endpoint = 'https://fcm.googleapis.com/fcm/send/abc';
const subscription = { endpoint, expirationTime: null, keys: { p256dh: 'BNc', auth: 'tBH' } };
const player = { player: { id: 'p' }, couple: { id: 'c' }, tokenHash: 'h' };

beforeEach(() => {
  turnOnNudges.mockReset().mockResolvedValue(undefined);
  turnOffNudges.mockReset().mockResolvedValue(undefined);
  currentPlayer.mockReset().mockResolvedValue(player);
  nudgePublicKey.mockReset().mockReturnValue('public-key');
});

describe('POST /api/us/nudges', () => {
  it('needs a player', async () => {
    currentPlayer.mockResolvedValue(null);
    expect((await POST(request('POST', subscription))).status).toBe(401);
    expect(turnOnNudges).not.toHaveBeenCalled();
  });

  it('is 404 nudges_off when no VAPID keys are set', async () => {
    nudgePublicKey.mockReturnValue(null);
    const res = await POST(request('POST', subscription));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'nudges_off', message: 'Nudges are not available yet.' });
    expect(turnOnNudges).not.toHaveBeenCalled();
  });

  it('validates before touching the database, and refuses any host but a push service', async () => {
    expect((await POST(request('POST', 'x', 'text/plain'))).status).toBe(415);
    const res = await POST(request('POST', { ...subscription, endpoint: 'https://example.com/steal' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid', message: 'This browser cannot get nudges.' });
    expect((await POST(request('POST', { endpoint }))).status).toBe(400);
    expect(turnOnNudges).not.toHaveBeenCalled();
  });

  it('turns nudges on for this phone', async () => {
    expect((await POST(request('POST', subscription))).status).toBe(204);
    expect(turnOnNudges).toHaveBeenCalledWith({}, player, { endpoint, keys: subscription.keys });
  });

  it('rate limits one address', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 61; i += 1) statuses.push((await POST(request('POST', subscription, 'application/json', '10.5.9.9'))).status);
    expect(statuses.slice(0, 60).every((s) => s === 204)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });
});

describe('DELETE /api/us/nudges', () => {
  it('needs a player', async () => {
    currentPlayer.mockResolvedValue(null);
    expect((await DELETE(request('DELETE', { endpoint }))).status).toBe(401);
  });

  it('validates before touching the database', async () => {
    expect((await DELETE(request('DELETE', 'x', 'text/plain'))).status).toBe(415);
    expect((await DELETE(request('DELETE', { endpoint: 'https://example.com/x' }))).status).toBe(400);
    expect((await DELETE(request('DELETE', { endpoint, keys: {} }))).status).toBe(400);
    expect(turnOffNudges).not.toHaveBeenCalled();
  });

  it('turns nudges off for this phone, even with no VAPID keys', async () => {
    nudgePublicKey.mockReturnValue(null);
    expect((await DELETE(request('DELETE', { endpoint }))).status).toBe(204);
    expect(turnOffNudges).toHaveBeenCalledWith({}, player, endpoint);
  });

  it('rate limits one address', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 61; i += 1) statuses.push((await DELETE(request('DELETE', { endpoint }, 'application/json', '10.5.8.8'))).status);
    expect(statuses.at(-1)).toBe(429);
  });
});
