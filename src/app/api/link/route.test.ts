import { beforeEach, describe, expect, it, vi } from 'vitest';

const redeemDeviceLink = vi.fn();
const currentPlayer = vi.fn();
const setPlayerCookie = vi.fn();
vi.mock('@/lib/couple/devices', () => ({ redeemDeviceLink: (...args: unknown[]) => redeemDeviceLink(...args) }));
vi.mock('@/lib/http/player-session', () => ({
  currentPlayer: () => currentPlayer(),
  setPlayerCookie: (...args: unknown[]) => setPlayerCookie(...args),
}));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const { POST } = await import('./route');

let ip = 0;
function post(body: unknown, contentType = 'application/json', address?: string) {
  ip += 1;
  return new Request('http://test/api/link', {
    method: 'POST',
    headers: { 'content-type': contentType, 'x-forwarded-for': address ?? `10.4.0.${ip}` },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const code = 'abcdefghjk';

beforeEach(() => {
  redeemDeviceLink.mockReset().mockResolvedValue({ kind: 'linked', token: 't' });
  currentPlayer.mockReset().mockResolvedValue(null);
  setPlayerCookie.mockReset();
});

describe('POST /api/link', () => {
  it('validates before touching the database', async () => {
    expect((await POST(post(`code=${code}`, 'application/x-www-form-urlencoded'))).status).toBe(415);
    const res = await POST(post({ code: 'not-a-code' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid', message: 'That link is not right. Make a new one in Settings.' });
    expect((await POST(post({ code, extra: 1 }))).status).toBe(400);
    expect(redeemDeviceLink).not.toHaveBeenCalled();
    expect(currentPlayer).not.toHaveBeenCalled();
  });

  it('signs this phone in without a player and sets the cookie', async () => {
    const res = await POST(post({ code }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ linked: true });
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    expect(redeemDeviceLink).toHaveBeenCalledWith({}, code, null);
    expect(setPlayerCookie).toHaveBeenCalledWith('t');
  });

  it('passes the phone\'s current player, if any', async () => {
    const player = { player: { id: 'p' }, couple: { id: 'c' } };
    currentPlayer.mockResolvedValue(player);
    await POST(post({ code }));
    expect(redeemDeviceLink).toHaveBeenCalledWith({}, code, player);
  });

  it.each([
    ['already_in', 409],
    ['partner_phone', 409],
    ['expired', 404],
    ['not_found', 404],
  ])('maps %s to %i without setting the cookie', async (kind, status) => {
    redeemDeviceLink.mockResolvedValue({ kind });
    const res = await POST(post({ code }));
    expect(res.status).toBe(status);
    expect(await res.json()).toMatchObject({ error: kind, message: expect.any(String) });
    expect(setPlayerCookie).not.toHaveBeenCalled();
  });

  it('rate limits one address, which also covers guessing codes', async () => {
    redeemDeviceLink.mockResolvedValue({ kind: 'not_found' });
    const statuses: number[] = [];
    for (let i = 0; i < 31; i += 1) statuses.push((await POST(post({ code }, 'application/json', '10.4.9.9'))).status);
    expect(statuses.slice(0, 30).every((s) => s === 404)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });
});
