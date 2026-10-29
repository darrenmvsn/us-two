import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RoundView } from '@/lib/couple/views';

const loadRevealedRound = vi.fn();
const currentPlayer = vi.fn();
const renderShareCard = vi.fn();
vi.mock('@/lib/couple/game', () => ({ loadRevealedRound: (...args: unknown[]) => loadRevealedRound(...args) }));
vi.mock('@/lib/http/player-session', () => ({ currentPlayer: () => currentPlayer() }));
vi.mock('@/lib/share-card/render', () => ({ renderShareCard: (...args: unknown[]) => renderShareCard(...args) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const { GET } = await import('./route');

let ip = 0;
function get(roundId = 'r1', address?: string) {
  ip += 1;
  const req = new Request(`http://test/api/us/rounds/${roundId}/card`, { headers: { 'x-forwarded-for': address ?? `10.6.0.${ip}` } });
  return GET(req, { params: Promise.resolve({ roundId }) });
}

const player = {
  player: { id: 'p0', name: 'Alex' },
  couple: { id: 'c', players: [{ id: 'p0', name: 'Alex' }, { id: 'p1', name: 'Sam' }] },
  tokenHash: 'h',
};

const revealed: RoundView = {
  id: 'r1',
  number: 1,
  question: { kind: 'pick', prompt: 'Who is the funnier one?', options: ['Me', 'Sam'] },
  state: 'revealed',
  mine: { kind: 'pick', choice: 'Me', guess: 'Me', guessedRight: true },
  theirs: { kind: 'pick', choice: 'Me', guess: 'Sam', guessedRight: false },
  matched: false,
};

beforeEach(() => {
  loadRevealedRound.mockReset().mockResolvedValue(revealed);
  currentPlayer.mockReset().mockResolvedValue(player);
  renderShareCard.mockReset().mockResolvedValue(new Response('png', { headers: { 'content-type': 'image/png' } }));
});

describe('GET /api/us/rounds/[roundId]/card', () => {
  it('needs a player', async () => {
    currentPlayer.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
    expect(loadRevealedRound).not.toHaveBeenCalled();
  });

  it('draws the revealed round with both names', async () => {
    const res = await get('r1');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(loadRevealedRound).toHaveBeenCalledWith({}, player, 'r1');
    expect(renderShareCard).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'round', people: { me: 'Alex', partner: 'Sam' }, bubbles: [expect.objectContaining({ text: 'Alex' }), expect.anything()] }),
    );
  });

  it('is 404 until both have answered, or for another couple\'s round', async () => {
    loadRevealedRound.mockResolvedValue(null);
    expect((await get('other')).status).toBe(404);
    loadRevealedRound.mockResolvedValue({ ...revealed, state: 'waiting', theirs: null });
    expect((await get()).status).toBe(404);
    expect(renderShareCard).not.toHaveBeenCalled();
  });

  it('rate limits one address at 20 a minute', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 21; i += 1) statuses.push((await get('r1', '10.6.9.9')).status);
    expect(statuses.slice(0, 20).every((s) => s === 200)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });
});
