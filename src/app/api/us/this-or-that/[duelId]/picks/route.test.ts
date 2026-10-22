import { beforeEach, describe, expect, it, vi } from 'vitest';

const submitPicks = vi.fn();
const currentPlayer = vi.fn();
vi.mock('@/lib/this-or-that/duels', () => ({ submitPicks: (...args: unknown[]) => submitPicks(...args) }));
vi.mock('@/lib/http/player-session', () => ({ currentPlayer: () => currentPlayer() }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const { POST } = await import('./route');

let ip = 0;
function post(body: unknown) {
  ip += 1;
  const req = new Request('http://test/api/us/this-or-that/d1/picks', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.2.0.${ip}` },
    body: JSON.stringify(body),
  });
  return POST(req, { params: Promise.resolve({ duelId: 'd1' }) });
}

const ten = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1];

beforeEach(() => {
  submitPicks.mockReset().mockResolvedValue({ kind: 'sent' });
  currentPlayer.mockReset().mockResolvedValue({ player: { id: 'p' }, couple: { id: 'c' } });
});

describe('POST /api/us/this-or-that/[duelId]/picks', () => {
  it('needs exactly ten picks of 0 or 1', async () => {
    expect((await post({ choices: [0, 1] })).status).toBe(400);
    expect((await post({ choices: [...ten.slice(0, 9), 2] })).status).toBe(400);
    expect(submitPicks).not.toHaveBeenCalled();
  });

  it('takes the duel from the path, not the body', async () => {
    expect((await post({ choices: ten, duelId: 'other' })).status).toBe(204);
    expect(submitPicks).toHaveBeenCalledWith({}, expect.anything(), 'd1', ten);
  });

  it.each([
    ['already_sent', 409],
    ['wrong_length', 400],
    ['not_found', 404],
  ])('maps %s to %i', async (kind, status) => {
    submitPicks.mockResolvedValue({ kind });
    expect((await post({ choices: ten })).status).toBe(status);
  });
});
