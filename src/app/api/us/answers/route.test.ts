import { beforeEach, describe, expect, it, vi } from 'vitest';

const submitAnswer = vi.fn();
const currentPlayer = vi.fn();
vi.mock('@/lib/couple/game', () => ({ submitAnswer: (...args: unknown[]) => submitAnswer(...args) }));
vi.mock('@/lib/http/player-session', () => ({ currentPlayer: () => currentPlayer() }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const { POST } = await import('./route');

let ip = 0;
function post(body: unknown) {
  ip += 1;
  return new Request('http://test/api/us/answers', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.1.0.${ip}` },
    body: JSON.stringify(body),
  });
}

const player = { player: { id: 'p' }, couple: { id: 'c' } };

beforeEach(() => {
  submitAnswer.mockReset();
  currentPlayer.mockReset().mockResolvedValue(player);
});

describe('POST /api/us/answers', () => {
  it('needs a player', async () => {
    currentPlayer.mockResolvedValue(null);
    expect((await POST(post({ kind: 'open', roundId: 'r', text: 'hi' }))).status).toBe(401);
  });

  it('validates before calling the game', async () => {
    expect((await POST(post({ kind: 'pick', roundId: 'r', choice: 5, guess: 0 }))).status).toBe(400);
    expect((await POST(post({ kind: 'open', roundId: 'r', text: 'x'.repeat(501) }))).status).toBe(400);
    expect((await POST(post({ kind: 'open', roundId: 'r', text: 'hi', extra: 1 }))).status).toBe(400);
    expect(submitAnswer).not.toHaveBeenCalled();
  });

  it.each([
    ['answered', 204],
    ['already_answered', 409],
    ['not_current', 409],
    ['not_found', 404],
    ['wrong_kind', 400],
    ['bad_option', 400],
  ])('maps %s to %i', async (kind, status) => {
    submitAnswer.mockResolvedValue({ kind });
    expect((await POST(post({ kind: 'open', roundId: 'r', text: 'hi' }))).status).toBe(status);
  });
});
