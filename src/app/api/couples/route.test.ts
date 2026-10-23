import { beforeEach, describe, expect, it, vi } from 'vitest';

const startCouple = vi.fn();
const setPlayerCookie = vi.fn();
vi.mock('@/lib/couple/game', () => ({ startCouple: (...args: unknown[]) => startCouple(...args) }));
vi.mock('@/lib/http/player-session', () => ({ setPlayerCookie: (...args: unknown[]) => setPlayerCookie(...args) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const { POST } = await import('./route');

let ip = 0;
function post(body: unknown, contentType = 'application/json') {
  ip += 1;
  return new Request('http://test/api/couples', {
    method: 'POST',
    headers: { 'content-type': contentType, 'x-forwarded-for': `10.0.0.${ip}` },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  startCouple.mockReset().mockResolvedValue({ token: 't', coupleId: 'c' });
  setPlayerCookie.mockReset();
});

describe('POST /api/couples', () => {
  it('refuses anything but JSON, before touching the database', async () => {
    expect((await POST(post('name=Alex', 'application/x-www-form-urlencoded'))).status).toBe(415);
    expect(startCouple).not.toHaveBeenCalled();
  });

  it('refuses a missing or overlong name with a message to show', async () => {
    const res = await POST(post({ name: '  ', timeZone: 'UTC' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'invalid', message: 'Add your first name.' });
    expect((await POST(post({ name: 'x'.repeat(25), timeZone: 'UTC' }))).status).toBe(400);
    expect((await POST(post({ name: '<b>', timeZone: 'UTC' }))).status).toBe(400);
    expect(startCouple).not.toHaveBeenCalled();
  });

  it('starts a game, trims the name, falls back to UTC for an unknown zone and sets the cookie', async () => {
    const res = await POST(post({ name: ' Alex ', timeZone: 'Mars/Base' }));
    expect(res.status).toBe(201);
    expect(startCouple).toHaveBeenCalledWith({}, { name: 'Alex', timeZone: 'UTC' });
    expect(setPlayerCookie).toHaveBeenCalledWith('t');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
  });

  it('rate limits one address', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 21; i += 1) {
      const req = new Request('http://test/api/couples', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.9.9.9' },
        body: JSON.stringify({ name: 'Alex', timeZone: 'UTC' }),
      });
      statuses.push((await POST(req)).status);
    }
    expect(statuses.at(-1)).toBe(429);
    expect(statuses.slice(0, 20).every((s) => s === 201)).toBe(true);
  });
});
