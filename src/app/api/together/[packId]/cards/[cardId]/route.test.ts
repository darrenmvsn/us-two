import { beforeEach, describe, expect, it, vi } from 'vitest';

const renderTogetherCard = vi.fn();
vi.mock('@/lib/share-card/question-card', () => ({ renderTogetherCard: (...args: unknown[]) => renderTogetherCard(...args) }));

const { GET } = await import('./route');

let ip = 0;
function get(packId: string, cardId: string, query = '') {
  ip += 1;
  const req = new Request(`http://test/api/together/${packId}/cards/${cardId}${query}`, { headers: { 'x-forwarded-for': `10.9.0.${ip}` } });
  return GET(req, { params: Promise.resolve({ packId, cardId }) });
}

beforeEach(() => {
  renderTogetherCard.mockReset().mockResolvedValue(new Response('png', { headers: { 'content-type': 'image/png' } }));
});

describe('GET /api/together/[packId]/cards/[cardId]', () => {
  it('draws a question as a story by default, with no session needed', async () => {
    const res = await get('everyday', 'everyday-002');
    expect(res.status).toBe(200);
    expect(renderTogetherCard).toHaveBeenCalledWith(expect.objectContaining({ kind: 'question', number: 2 }), 'story');
  });

  it('draws a cover as a post', async () => {
    await get('deep', 'cover', '?format=post');
    expect(renderTogetherCard).toHaveBeenCalledWith(expect.objectContaining({ kind: 'cover', packTitle: 'Deep' }), 'post');
  });

  it('refuses an unknown format, pack or card', async () => {
    expect((await get('deep', 'cover', '?format=square')).status).toBe(400);
    expect((await get('nope', 'cover')).status).toBe(404);
    expect((await get('deep', 'everyday-001')).status).toBe(404);
    expect(renderTogetherCard).not.toHaveBeenCalled();
  });

  it('limits how often one client draws cards', async () => {
    let last = 0;
    for (let i = 0; i < 25; i += 1) {
      const req = new Request('http://test/api/together/deep/cards/cover', { headers: { 'x-forwarded-for': '10.9.9.9' } });
      last = (await GET(req, { params: Promise.resolve({ packId: 'deep', cardId: 'cover' }) })).status;
    }
    expect(last).toBe(429);
  });
});
