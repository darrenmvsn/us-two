import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DuelView } from '@/lib/this-or-that/duels';

const loadDuel = vi.fn();
const currentPlayer = vi.fn();
const renderShareCard = vi.fn();
vi.mock('@/lib/this-or-that/duels', () => ({ loadDuel: (...args: unknown[]) => loadDuel(...args) }));
vi.mock('@/lib/http/player-session', () => ({ currentPlayer: () => currentPlayer() }));
vi.mock('@/lib/share-card/render', () => ({ renderShareCard: (...args: unknown[]) => renderShareCard(...args) }));
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const { GET } = await import('./route');

let ip = 0;
function get(duelId = 'd1', address?: string) {
  ip += 1;
  const req = new Request(`http://test/api/us/this-or-that/${duelId}/card`, { headers: { 'x-forwarded-for': address ?? `10.7.0.${ip}` } });
  return GET(req, { params: Promise.resolve({ duelId }) });
}

const player = {
  player: { id: 'p1', name: 'Sam' },
  couple: { id: 'c', players: [{ id: 'p0', name: 'Alex' }, { id: 'p1', name: 'Sam' }] },
  tokenHash: 'h',
};

const revealed: DuelView = {
  id: 'd1',
  set: { id: 'food', title: 'Food', items: Array.from({ length: 10 }, (_, i) => [`a${i}`, `b${i}`] as const) },
  state: 'revealed',
  startedByMe: false,
  mine: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  theirs: [0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
  matched: 5,
  verdict: 'Half and half',
};

beforeEach(() => {
  loadDuel.mockReset().mockResolvedValue(revealed);
  currentPlayer.mockReset().mockResolvedValue(player);
  renderShareCard.mockReset().mockResolvedValue(new Response('png', { headers: { 'content-type': 'image/png' } }));
});

describe('GET /api/us/this-or-that/[duelId]/card', () => {
  it('needs a player', async () => {
    currentPlayer.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
    expect(loadDuel).not.toHaveBeenCalled();
  });

  it('draws the score from the viewer\'s side', async () => {
    const res = await get('d1');
    expect(res.status).toBe(200);
    expect(loadDuel).toHaveBeenCalledWith({}, player, 'd1');
    expect(renderShareCard).toHaveBeenCalledWith(expect.objectContaining({ kind: 'duel', headline: 'Sam and Alex matched 5 of 10' }));
  });

  it('is 404 for no such set and until both have played', async () => {
    loadDuel.mockResolvedValue(null);
    expect((await get('nope')).status).toBe(404);
    loadDuel.mockResolvedValue({ ...revealed, state: 'waiting', theirs: null, matched: null, verdict: null });
    expect((await get()).status).toBe(404);
    expect(renderShareCard).not.toHaveBeenCalled();
  });

  it('rate limits one address at 20 a minute', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 21; i += 1) statuses.push((await get('d1', '10.7.9.9')).status);
    expect(statuses.slice(0, 20).every((s) => s === 200)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });
});
