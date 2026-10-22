import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { joinCouple, resolvePlayer, startCouple, type PlayerContext } from '@/lib/couple/game';
import { createTestDb, TEST_DATABASE_URL } from '@/lib/testing/test-db';
import { loadDuel, loadThisOrThat, startDuel, submitPicks } from './duels';

const run = describe.skipIf(!TEST_DATABASE_URL);

run('This or that, end to end on Postgres', () => {
  let db: PrismaClient;
  let drop: () => Promise<void>;
  beforeAll(async () => ({ db, drop } = await createTestDb()), 60_000);
  afterAll(async () => drop?.());

  async function pair(): Promise<{ alex: PlayerContext; sam: PlayerContext }> {
    const started = await startCouple(db, { name: 'Alex', timeZone: 'UTC' });
    const alex = (await resolvePlayer(db, started.token))!;
    const joined = await joinCouple(db, { name: 'Sam', inviteCode: alex.couple.inviteCode }, null);
    if (joined.kind !== 'joined') throw new Error(joined.kind);
    return { alex: (await resolvePlayer(db, started.token))!, sam: (await resolvePlayer(db, joined.token))! };
  }

  const alexPicks = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1];
  const samPicks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  it('plays a set: hidden while waiting, scored once both are in', async () => {
    const { alex, sam } = await pair();
    expect(await startDuel(db, alex, 'nope')).toEqual({ kind: 'unknown_set' });
    const started = await startDuel(db, alex, 'food');
    if (started.kind !== 'started') throw new Error(started.kind);
    // A second start while one is open returns the open one.
    expect(await startDuel(db, sam, 'travel')).toEqual({ kind: 'one_open', duelId: started.duelId });

    expect(await submitPicks(db, alex, started.duelId, alexPicks)).toEqual({ kind: 'sent' });
    expect(await submitPicks(db, alex, started.duelId, alexPicks)).toEqual({ kind: 'already_sent' });
    expect(await loadDuel(db, alex, started.duelId)).toMatchObject({ state: 'waiting', theirs: null, matched: null });
    expect(await loadDuel(db, sam, started.duelId)).toMatchObject({ state: 'play', theirs: null, startedByMe: false });

    await submitPicks(db, sam, started.duelId, samPicks);
    expect(await loadDuel(db, sam, started.duelId)).toMatchObject({ state: 'revealed', mine: samPicks, theirs: alexPicks, matched: 5 });

    const home = await loadThisOrThat(db, alex);
    expect(home.open).toBeNull();
    expect(home.finished).toEqual([{ id: started.duelId, setTitle: 'Food', matched: 5 }]);
    expect(home.sets.find((s) => s.id === 'food')?.played).toBe(true);
  });

  it('keeps couples apart', async () => {
    const a = await pair();
    const b = await pair();
    const started = await startDuel(db, a.alex, 'us');
    if (started.kind !== 'started') throw new Error(started.kind);
    expect(await loadDuel(db, b.alex, started.duelId)).toBeNull();
    expect(await submitPicks(db, b.alex, started.duelId, alexPicks)).toEqual({ kind: 'not_found' });
  });

  it('opens one set when both phones press start together', async () => {
    const { alex, sam } = await pair();
    const results = await Promise.all([startDuel(db, alex, 'home'), startDuel(db, sam, 'travel')]);
    const ids = new Set(results.map((r) => ('duelId' in r ? r.duelId : null)));
    expect(ids.size).toBe(1);
    expect(await db.duel.count({ where: { coupleId: alex.couple.id } })).toBe(1);
  });
});
