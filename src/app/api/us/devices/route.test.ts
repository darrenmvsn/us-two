import { beforeEach, describe, expect, it, vi } from 'vitest';

const createDeviceLink = vi.fn();
const signOutOtherPhones = vi.fn();
const currentPlayer = vi.fn();
vi.mock('@/lib/couple/devices', () => ({
  createDeviceLink: (...args: unknown[]) => createDeviceLink(...args),
  signOutOtherPhones: (...args: unknown[]) => signOutOtherPhones(...args),
}));
vi.mock('@/lib/http/player-session', () => ({ currentPlayer: () => currentPlayer() }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const { POST, DELETE } = await import('./route');

let ip = 0;
function request(method: 'POST' | 'DELETE', body?: unknown, contentType = 'application/json', address?: string) {
  ip += 1;
  return new Request('http://test/api/us/devices', {
    method,
    headers: { 'content-type': contentType, 'x-forwarded-for': address ?? `10.3.0.${ip}` },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const player = { player: { id: 'p' }, couple: { id: 'c' }, tokenHash: 'h' };

beforeEach(() => {
  createDeviceLink.mockReset();
  signOutOtherPhones.mockReset().mockResolvedValue(undefined);
  currentPlayer.mockReset().mockResolvedValue(player);
});

describe('POST /api/us/devices', () => {
  it('needs a player', async () => {
    currentPlayer.mockResolvedValue(null);
    expect((await POST(request('POST', { for: 'me' }))).status).toBe(401);
    expect(createDeviceLink).not.toHaveBeenCalled();
  });

  it('validates before calling the game', async () => {
    expect((await POST(request('POST', 'for=me', 'application/x-www-form-urlencoded'))).status).toBe(415);
    expect((await POST(request('POST', { for: 'them' }))).status).toBe(400);
    expect((await POST(request('POST', { for: 'me', extra: 1 }))).status).toBe(400);
    expect((await POST(request('POST', '{', 'application/json'))).status).toBe(400);
    expect(createDeviceLink).not.toHaveBeenCalled();
  });

  it('makes a link and returns its path and expiry, never cached', async () => {
    createDeviceLink.mockResolvedValue({ kind: 'created', code: 'abcdefghjk', expiresAt: new Date('2026-10-22T09:30:00Z') });
    const res = await POST(request('POST', { for: 'partner' }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ path: '/link/abcdefghjk', expiresAt: '2026-10-22T09:30:00.000Z' });
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    expect(createDeviceLink).toHaveBeenCalledWith({}, player, 'partner');
  });

  it('maps no_partner to 409', async () => {
    createDeviceLink.mockResolvedValue({ kind: 'no_partner' });
    const res = await POST(request('POST', { for: 'partner' }));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'no_partner', message: 'Your partner has not joined yet.' });
  });

  it('rate limits one address', async () => {
    createDeviceLink.mockResolvedValue({ kind: 'no_partner' });
    const statuses: number[] = [];
    for (let i = 0; i < 61; i += 1) statuses.push((await POST(request('POST', { for: 'me' }, 'application/json', '10.3.9.9'))).status);
    expect(statuses.slice(0, 60).every((s) => s === 409)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });
});

describe('DELETE /api/us/devices', () => {
  it('needs a player', async () => {
    currentPlayer.mockResolvedValue(null);
    expect((await DELETE(request('DELETE'))).status).toBe(401);
    expect(signOutOtherPhones).not.toHaveBeenCalled();
  });

  it('signs out the other phones', async () => {
    expect((await DELETE(request('DELETE'))).status).toBe(204);
    expect(signOutOtherPhones).toHaveBeenCalledWith({}, player);
  });

  it('rate limits one address', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 61; i += 1) statuses.push((await DELETE(request('DELETE', undefined, 'application/json', '10.3.8.8'))).status);
    expect(statuses.at(-1)).toBe(429);
    expect(signOutOtherPhones).toHaveBeenCalledTimes(60);
  });
});
