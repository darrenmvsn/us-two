import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { joinCouple, loadHome, loadRevealedRound, resolvePlayer, startCouple, submitAnswer, type PlayerContext } from '@/lib/couple/game';
import { createTestDb, TEST_DATABASE_URL } from '@/lib/testing/test-db';
import { cardPeople, roundCardContent } from './card-content';

const run = describe.skipIf(!TEST_DATABASE_URL);

run('a revealed round for its share card, on Postgres', () => {
  let db: PrismaClient;
  let drop: () => Promise<void>;
  beforeAll(async () => ({ db, drop } = await createTestDb()), 60_000);
  afterAll(async () => drop?.());

  const day1 = new Date('2026-10-22T09:00:00Z');

  async function pair(): Promise<{ alex: PlayerContext; sam: PlayerContext }> {
    const started = await startCouple(db, { name: 'Alex', timeZone: 'UTC' }, day1);
    const alone = (await resolvePlayer(db, started.token))!;
    const joined = await joinCouple(db, { name: 'Sam', inviteCode: alone.couple.inviteCode }, null, day1);
    if (joined.kind !== 'joined') throw new Error(joined.kind);
    return { alex: (await resolvePlayer(db, started.token))!, sam: (await resolvePlayer(db, joined.token))! };
  }

  it('is null until both have answered, then each side sees its own card', async () => {
    const { alex, sam } = await pair();
    const round = (await loadHome(db, alex, day1)).round!;
    expect(await loadRevealedRound(db, alex, round.id)).toBeNull();

    await submitAnswer(db, alex, { kind: 'pick', roundId: round.id, choice: 0, guess: 1 }, day1);
    expect(await loadRevealedRound(db, alex, round.id)).toBeNull();
    expect(await loadRevealedRound(db, sam, round.id)).toBeNull();

    await submitAnswer(db, sam, { kind: 'pick', roundId: round.id, choice: 0, guess: 0 }, day1);
    const fromAlex = (await loadRevealedRound(db, alex, round.id))!;
    expect(fromAlex).toMatchObject({ id: round.id, state: 'revealed', matched: true });
    const card = roundCardContent(fromAlex, cardPeople(alex))!;
    expect(card.people).toEqual({ me: 'Alex', partner: 'Sam' });
    expect(card.bubbles.map((b) => [b.who, b.name])).toEqual([
      ['you', 'Alex'],
      ['them', 'Sam'],
    ]);
    expect(roundCardContent((await loadRevealedRound(db, sam, round.id))!, cardPeople(sam))!.people).toEqual({ me: 'Sam', partner: 'Alex' });
  });

  it('is null for another couple\'s round and an unknown id', async () => {
    const { alex, sam } = await pair();
    const round = (await loadHome(db, alex, day1)).round!;
    await submitAnswer(db, alex, { kind: 'pick', roundId: round.id, choice: 0, guess: 0 }, day1);
    await submitAnswer(db, sam, { kind: 'pick', roundId: round.id, choice: 1, guess: 0 }, day1);
    const { alex: stranger } = await pair();
    expect(await loadRevealedRound(db, stranger, round.id)).toBeNull();
    expect(await loadRevealedRound(db, alex, 'nope')).toBeNull();
  });
});
