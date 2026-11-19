import { Prisma } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { guardRoute } from './unexpected-error';

afterEach(() => vi.restoreAllMocks());

function quietly() {
  vi.spyOn(console, 'error').mockImplementation(() => {});
}

describe('guardRoute', () => {
  it('passes a handled response through untouched', async () => {
    const handler = guardRoute(async (status: number) => new Response(null, { status }));
    expect((await handler(204)).status).toBe(204);
  });

  it('answers 503 JSON while the database is unreachable', async () => {
    quietly();
    const down = new Prisma.PrismaClientKnownRequestError("Can't reach database server", { code: 'P1001', clientVersion: 'test' });
    const response = await guardRoute(async () => {
      throw down;
    })();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'unavailable', message: expect.any(String) });
  });

  it('answers 503 when the client cannot start', async () => {
    quietly();
    const response = await guardRoute(async () => {
      throw new Prisma.PrismaClientInitializationError('no database', 'test');
    })();
    expect(response.status).toBe(503);
  });

  it('answers a bare 500 JSON for anything else, without the error text', async () => {
    quietly();
    const response = await guardRoute(async () => {
      throw new Error('secret detail');
    })();
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('server_error');
    expect(JSON.stringify(body)).not.toContain('secret detail');
  });
});
