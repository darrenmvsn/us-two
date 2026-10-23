import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { createTestDb, TEST_DATABASE_URL } from '@/lib/testing/test-db';
import { choosePack, endCouple, inviteInfo, joinCouple, loadHome, loadPast, openNextQuestion, resolvePlayer, startCouple, submitAnswer, type PlayerContext } from './game';

const run = describe.skipIf(!TEST_DATABASE_URL);

run('the daily question, end to end on Postgres', () => {
  let db: PrismaClient;
  let drop: () => Promise<void>;
  beforeAll(async () => ({ db, drop } = await createTestDb()), 60_000);
  afterAll(async () => drop?.());

  const day1 = new Date('2026-10-22T09:00:00Z');
  const day2 = new Date('2026-10-23T09:00:00Z');
  const day3 = new Date('2026-10-24T09:00:00Z');

  async function pair(): Promise<{ alex: PlayerContext; sam: PlayerContext; inviteCode: string }> {
    const started = await startCouple(db, { name: 'Alex', timeZone: 'UTC' }, day1);
    const alex = (await resolvePlayer(db, started.token))!;
    const joined = await joinCouple(db, { name: 'Sam', inviteCode: alex.couple.inviteCode }, null, day1);
    if (joined.kind !== 'joined') throw new Error(joined.kind);
    return { alex: (await resolvePlayer(db, started.token))!, sam: (await resolvePlayer(db, joined.token))!, inviteCode: alex.couple.inviteCode };
  }

  it('opens the first question for the starter before the partner joins', async () => {
    const started = await startCouple(db, { name: 'Alex', timeZone: 'UTC' }, day1);
    const alex = (await resolvePlayer(db, started.token))!;
    const home = await loadHome(db, alex, day1);
    expect(home.partner).toBeNull();
    expect(home.inviteCode).toMatch(/^[a-z2-9]{10}$/);
    expect(home.round).toMatchObject({ number: 1, state: 'answer' });
    expect(await inviteInfo(db, home.inviteCode!)).toEqual({ kind: 'open', starterName: 'Alex' });
  });

  it('lets one person join a link, once', async () => {
    const { alex, inviteCode } = await pair();
    expect(await joinCouple(db, { name: 'Jo', inviteCode }, null)).toEqual({ kind: 'taken' });
    expect(await joinCouple(db, { name: 'Alex', inviteCode }, alex)).toEqual({ kind: 'own_invite' });
    expect(await joinCouple(db, { name: 'Jo', inviteCode: 'zzzzzzzzzz' }, null)).toEqual({ kind: 'not_found' });
    expect(await inviteInfo(db, inviteCode)).toEqual({ kind: 'taken' });
  });

  it('hides answers until both are in, then reveals and scores', async () => {
    const { alex, sam } = await pair();
    const round = (await loadHome(db, alex, day1)).round!;
    expect(round.question.kind).toBe('pick');

    expect(await submitAnswer(db, alex, { kind: 'pick', roundId: round.id, choice: 0, guess: 1 }, day1)).toEqual({ kind: 'answered' });
    expect(await submitAnswer(db, alex, { kind: 'pick', roundId: round.id, choice: 1, guess: 1 }, day1)).toEqual({ kind: 'already_answered' });
    const waiting = await loadHome(db, alex, day1);
    expect(waiting.round).toMatchObject({ state: 'waiting', theirs: null });
    expect(waiting.next).toEqual({ kind: 'waiting_on_answers' });
    expect((await loadHome(db, sam, day1)).round).toMatchObject({ state: 'answer', mine: null, theirs: null });

    await submitAnswer(db, sam, { kind: 'pick', roundId: round.id, choice: 0, guess: 0 }, day1);
    const revealed = await loadHome(db, sam, day1);
    // The reveal stays on screen; the first day's next question waits to be asked for.
    expect(revealed.round).toMatchObject({ number: 1, state: 'revealed' });
    expect(revealed.next).toEqual({ kind: 'open' });
    expect(await openNextQuestion(db, alex, day1)).toEqual({ kind: 'opened' });
    expect((await loadHome(db, sam, day1)).round).toMatchObject({ number: 2, state: 'answer' });
    const past = await loadPast(db, sam);
    expect(past[0]!.view).toMatchObject({ state: 'revealed', matched: true, mine: { guessedRight: true }, theirs: { guessedRight: false } });
    expect(revealed.guesses).toEqual({ mine: { right: 1, total: 1 }, theirs: { right: 0, total: 1 } });
    expect(revealed.streak).toBe(1);
  });

  it('refuses a stale round, a bad option and the wrong kind', async () => {
    const { alex, sam } = await pair();
    const first = (await loadHome(db, alex, day1)).round!;
    expect(await submitAnswer(db, alex, { kind: 'pick', roundId: first.id, choice: 4, guess: 0 })).toEqual({ kind: 'bad_option' });
    expect(await submitAnswer(db, alex, { kind: 'open', roundId: first.id, text: 'hi' })).toEqual({ kind: 'wrong_kind' });
    await submitAnswer(db, alex, { kind: 'pick', roundId: first.id, choice: 0, guess: 0 });
    await submitAnswer(db, sam, { kind: 'pick', roundId: first.id, choice: 0, guess: 0 });
    await openNextQuestion(db, alex, day1);
    expect(await submitAnswer(db, alex, { kind: 'pick', roundId: first.id, choice: 0, guess: 0 })).toEqual({ kind: 'not_current' });
    expect(await submitAnswer(db, sam, { kind: 'pick', roundId: 'nope', choice: 0, guess: 0 })).toEqual({ kind: 'not_found' });
  });

  it('gives three questions on day one, one a day after, and keeps the streak', async () => {
    const { alex, sam } = await pair();
    async function playBoth(at: Date) {
      await openNextQuestion(db, alex, at);
      const round = (await loadHome(db, alex, at)).round!;
      for (const p of [alex, sam]) {
        const input =
          round.question.kind === 'pick'
            ? ({ kind: 'pick', roundId: round.id, choice: 0, guess: 0 } as const)
            : ({ kind: 'open', roundId: round.id, text: 'An answer' } as const);
        await submitAnswer(db, p, input, at);
      }
    }
    for (let i = 0; i < 3; i += 1) await playBoth(day1);
    const end = await loadHome(db, alex, day1);
    expect(end.next.kind).toBe('tomorrow');
    expect(await openNextQuestion(db, alex, day1)).toEqual({ kind: 'not_yet' });
    expect(end.round?.state).toBe('revealed');

    await playBoth(day2);
    expect((await loadHome(db, alex, day2)).next.kind).toBe('tomorrow');
    expect((await loadHome(db, alex, day3)).streak).toBe(2);
  });

  it('switches pack for the next question and refuses unknown packs', async () => {
    const { alex, sam } = await pair();
    await loadHome(db, alex, day1);
    expect(await choosePack(db, alex, 'nope')).toEqual({ kind: 'unknown_pack' });
    expect(await choosePack(db, alex, 'deep')).toEqual({ kind: 'chosen' });
    const reloaded = { ...alex, couple: { ...alex.couple, packId: 'deep' } };
    const first = (await loadHome(db, reloaded, day1)).round!;
    expect(first.question.prompt).not.toBe('When do you feel most loved by me?');
    await submitAnswer(db, alex, { kind: 'pick', roundId: first.id, choice: 0, guess: 0 });
    await submitAnswer(db, sam, { kind: 'pick', roundId: first.id, choice: 0, guess: 0 });
    // The next round comes from the new pack.
    await openNextQuestion(db, reloaded, day1);
    expect((await loadHome(db, reloaded, day1)).round?.question.prompt).toBe('When do you feel most loved by me?');
  });

  it('ends the game for both phones', async () => {
    const { alex, sam } = await pair();
    await endCouple(db, alex);
    expect(await db.couple.findUnique({ where: { id: sam.couple.id } })).toBeNull();
    expect(await db.player.count({ where: { id: { in: [alex.player.id, sam.player.id] } } })).toBe(0);
  });
});

