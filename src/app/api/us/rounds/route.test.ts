import { beforeEach, describe, expect, it, vi } from 'vitest';

const openNextQuestion = vi.fn();
const currentPlayer = vi.fn();
vi.mock('@/lib/couple/game', () => ({ openNextQuestion: (...args: unknown[]) => openNextQuestion(...args) }));
vi.mock('@/lib/http/player-session', () => ({ currentPlayer: () => currentPlayer() }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const { POST } = await import('./route');

let ip = 0;
function post(headers: Record<string, string> = {}) {
  ip += 1;
  return new Request('http://test/api/us/rounds', { method: 'POST', headers: { 'x-forwarded-for': `10.6.0.${ip}`, ...headers } });
}

const player = { player: { id: 'p' }, couple: { id: 'c' } };

beforeEach(() => {
  openNextQuestion.mockReset();
  currentPlayer.mockReset().mockResolvedValue(player);
});

describe('POST /api/us/rounds', () => {
  it('needs a player', async () => {
    currentPlayer.mockResolvedValue(null);
    expect((await POST(post())).status).toBe(401);
    expect(openNextQuestion).not.toHaveBeenCalled();
  });

  it('refuses a request another site made, such as a sibling subdomain’s form', async () => {
    expect((await POST(post({ 'sec-fetch-site': 'same-site' }))).status).toBe(403);
    expect(openNextQuestion).not.toHaveBeenCalled();
  });

  it.each([
    ['opened', 204],
    ['not_yet', 409],
  ])('maps %s to %i', async (kind, status) => {
    openNextQuestion.mockResolvedValue({ kind });
    expect((await POST(post({ 'sec-fetch-site': 'same-origin' }))).status).toBe(status);
    expect(openNextQuestion).toHaveBeenCalledWith({}, player);
  });
});
