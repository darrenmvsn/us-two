import { beforeEach, describe, expect, it, vi } from 'vitest';

const endCouple = vi.fn();
const loadHome = vi.fn();
const currentPlayer = vi.fn();
const clearPlayerCookie = vi.fn();
vi.mock('@/lib/couple/game', () => ({
  endCouple: (...args: unknown[]) => endCouple(...args),
  loadHome: (...args: unknown[]) => loadHome(...args),
}));
vi.mock('@/lib/http/player-session', () => ({ currentPlayer: () => currentPlayer(), clearPlayerCookie: () => clearPlayerCookie() }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const { DELETE, GET } = await import('./route');

let ip = 0;
function request(method: 'GET' | 'DELETE', headers: Record<string, string> = {}) {
  ip += 1;
  return new Request('http://test/api/us', { method, headers: { 'x-forwarded-for': `10.7.0.${ip}`, ...headers } });
}

const player = { player: { id: 'p' }, couple: { id: 'c' } };

beforeEach(() => {
  endCouple.mockReset().mockResolvedValue(undefined);
  loadHome.mockReset().mockResolvedValue({ state: 'waiting' });
  clearPlayerCookie.mockReset().mockResolvedValue(undefined);
  currentPlayer.mockReset().mockResolvedValue(player);
});

describe('GET /api/us', () => {
  it('needs a player, and is never cached', async () => {
    const res = await GET(request('GET'));
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    currentPlayer.mockResolvedValue(null);
    expect((await GET(request('GET'))).status).toBe(401);
  });
});

describe('DELETE /api/us', () => {
  it('ends the game and clears the cookie', async () => {
    expect((await DELETE(request('DELETE'))).status).toBe(204);
    expect(endCouple).toHaveBeenCalledWith({}, player);
    expect(clearPlayerCookie).toHaveBeenCalled();
  });

  it('refuses a request another site made', async () => {
    expect((await DELETE(request('DELETE', { 'sec-fetch-site': 'cross-site' }))).status).toBe(403);
    expect(endCouple).not.toHaveBeenCalled();
  });

  it('needs a player', async () => {
    currentPlayer.mockResolvedValue(null);
    expect((await DELETE(request('DELETE'))).status).toBe(401);
    expect(endCouple).not.toHaveBeenCalled();
  });
});
