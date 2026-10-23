import { Prisma, type Couple, type Player } from '@prisma/client';
import type { Db } from '@/lib/prisma';
import {
  reportCoupleEnded,
  reportCoupleStarted,
  reportPackChosen,
  reportPartnerJoined,
  reportQuestionAnswered,
  reportRoundRevealed,
} from '@/lib/analytics/product-events';
import { DEFAULT_PACK, isPackId, packAccess, packById, questionById, type PackId } from '@/lib/questions/packs';
import { toStoredChoice, type Seat } from '@/lib/questions/perspective';
import type { Question } from '@/lib/questions/types';
import { dayKeyIn, msUntilNextDay } from './day';
import type { AnswerInput } from './inputs';
import { hashPlayerToken, newInviteCode, newPlayerToken } from './player-token';
import { nextQuestionId, nextRound } from './schedule';
import { currentStreak } from './streak';
import { buildRoundView, guessScores, revealedAt, type Names, type RoundView, type StoredAnswer } from './views';

/**
 * The game's application layer: each function takes the database, does one
 * thing a player asked for and returns a discriminated result. Route handlers
 * map results to HTTP; nothing here knows about requests or cookies.
 */

export interface PlayerContext {
  player: Player;
  couple: Couple & { players: Player[] };
}

export async function resolvePlayer(db: Db, token: string): Promise<PlayerContext | null> {
  const player = await db.player.findUnique({
    where: { tokenHash: hashPlayerToken(token) },
    include: { couple: { include: { players: true } } },
  });
  if (!player) return null;
  const { couple, ...rest } = player;
  return { player: rest, couple };
}

function seatOf(player: Player): Seat {
  return player.seat === 1 ? 1 : 0;
}

function namesOf(players: readonly Player[]): Names {
  return {
    seat0: players.find((p) => p.seat === 0)?.name ?? '',
    seat1: players.find((p) => p.seat === 1)?.name ?? null,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/* ---------- starting and joining ---------- */

export async function startCouple(db: Db, input: { name: string; timeZone: string }, now: Date = new Date()) {
  const { token, tokenHash } = newPlayerToken();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const couple = await db.couple.create({
        data: {
          inviteCode: newInviteCode(),
          createdAt: now,
          timeZone: input.timeZone,
          packId: DEFAULT_PACK,
          players: { create: { seat: 0, name: input.name, tokenHash } },
        },
        include: { players: true },
      });
      reportCoupleStarted(couple.id, couple.players[0]!.id);
      return { token, coupleId: couple.id };
    } catch (error) {
      // An invite code collision (31^10 codes) is retried with a new code.
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new Error('could not mint a unique invite code');
}

export type InviteInfo = { kind: 'open'; starterName: string } | { kind: 'taken' } | { kind: 'not_found' };

export async function inviteInfo(db: Db, inviteCode: string): Promise<InviteInfo> {
  const couple = await db.couple.findUnique({ where: { inviteCode }, include: { players: true } });
  if (!couple) return { kind: 'not_found' };
  if (couple.players.length >= 2) return { kind: 'taken' };
  return { kind: 'open', starterName: couple.players[0]?.name ?? '' };
}

export type JoinResult =
  | { kind: 'joined'; token: string }
  | { kind: 'not_found' }
  | { kind: 'taken' }
  | { kind: 'own_invite' };

export async function joinCouple(
  db: Db,
  input: { name: string; inviteCode: string },
  current: PlayerContext | null,
  now: Date = new Date(),
): Promise<JoinResult> {
  const couple = await db.couple.findUnique({ where: { inviteCode: input.inviteCode } });
  if (!couple) return { kind: 'not_found' };
  if (current?.couple.id === couple.id) return { kind: 'own_invite' };
  const { token, tokenHash } = newPlayerToken();
  try {
    const player = await db.player.create({ data: { coupleId: couple.id, seat: 1, name: input.name, tokenHash } });
    reportPartnerJoined(couple.id, player.id, (now.getTime() - couple.createdAt.getTime()) / 3_600_000);
    return { kind: 'joined', token };
  } catch (error) {
    // (coupleId, seat) is unique: two people racing for one link, one wins.
    if (isUniqueViolation(error)) return { kind: 'taken' };
    throw error;
  }
}

/* ---------- the daily question ---------- */

export interface HomeView {
  me: { name: string; seat: Seat };
  partner: { name: string } | null;
  /** Set until the partner joins. */
  inviteCode: string | null;
  pack: { id: PackId; title: string };
  round: RoundView | null;
  /** What happens after the round on screen. */
  next: { kind: 'waiting_on_answers' } | { kind: 'tomorrow'; inMs: number } | { kind: 'open' } | { kind: 'all_answered' };
  streak: number;
  guesses: { mine: { right: number; total: number }; theirs: { right: number; total: number } };
}

type LoadedRound = {
  id: string;
  number: number;
  questionId: string;
  dayKey: string;
  answers: (StoredAnswer & { id: string })[];
};

async function loadRounds(db: Db, ctx: PlayerContext): Promise<LoadedRound[]> {
  const seatByPlayer = new Map(ctx.couple.players.map((p) => [p.id, seatOf(p)]));
  const rounds = await db.round.findMany({
    where: { coupleId: ctx.couple.id },
    orderBy: { number: 'asc' },
    include: { answers: true },
  });
  return rounds.map((r) => ({
    id: r.id,
    number: r.number,
    questionId: r.questionId,
    dayKey: r.dayKey,
    answers: r.answers.map((a) => ({
      id: a.id,
      seat: seatByPlayer.get(a.playerId) ?? 0,
      choice: a.choice,
      guess: a.guess,
      text: a.text,
      createdAt: a.createdAt,
    })),
  }));
}

/**
 * Opens the next round when the schedule allows; true when it did (or the
 * other phone just did). `auto` (a page load) opens only a couple's first
 * round or the first of a new day, so a reveal stays on screen until someone
 * asks for the next question; `requested` also opens the first day's extras.
 */
async function openRoundIfDue(db: Db, ctx: PlayerContext, rounds: LoadedRound[], now: Date, mode: 'auto' | 'requested'): Promise<boolean> {
  const today = dayKeyIn(ctx.couple.timeZone, now);
  const latest = rounds.at(-1);
  if (mode === 'auto' && latest && latest.dayKey >= today) return false;
  const firstDay = dayKeyIn(ctx.couple.timeZone, ctx.couple.createdAt);
  const decision = nextRound(
    rounds.map((r) => ({ dayKey: r.dayKey, answerCount: r.answers.length })),
    today,
    firstDay,
  );
  if (decision.kind !== 'open') return false;
  const pack = isPackId(ctx.couple.packId) ? ctx.couple.packId : DEFAULT_PACK;
  const questionId = nextQuestionId(pack, new Set(rounds.map((r) => r.questionId)));
  if (!questionId) return false;
  // Both unique keys make a concurrent second open a no-op instead of an error.
  // Either way a round now exists, so the caller reloads.
  await db.round.createMany({
    data: [{ coupleId: ctx.couple.id, number: (rounds.at(-1)?.number ?? 0) + 1, questionId, dayKey: today }],
    skipDuplicates: true,
  });
  return true;
}

function questionOf(round: LoadedRound): Question {
  const question = questionById(round.questionId);
  if (!question) throw new Error(`round ${round.id} points at unknown question ${round.questionId}`);
  return question;
}

function revealDays(rounds: readonly LoadedRound[], timeZone: string): Set<string> {
  const days = new Set<string>();
  for (const r of rounds) {
    const at = revealedAt(r.answers);
    if (at) days.add(dayKeyIn(timeZone, at));
  }
  return days;
}

export async function loadHome(db: Db, ctx: PlayerContext, now: Date = new Date()): Promise<HomeView> {
  let rounds = await loadRounds(db, ctx);
  if (await openRoundIfDue(db, ctx, rounds, now, 'auto')) rounds = await loadRounds(db, ctx);

  const seat = seatOf(ctx.player);
  const names = namesOf(ctx.couple.players);
  const partner = ctx.couple.players.find((p) => p.id !== ctx.player.id);
  const latest = rounds.at(-1);
  const today = dayKeyIn(ctx.couple.timeZone, now);
  const after = nextRound(
    rounds.map((r) => ({ dayKey: r.dayKey, answerCount: r.answers.length })),
    today,
    dayKeyIn(ctx.couple.timeZone, ctx.couple.createdAt),
  );
  const pack = isPackId(ctx.couple.packId) ? ctx.couple.packId : DEFAULT_PACK;
  const exhausted = nextQuestionId(pack, new Set(rounds.map((r) => r.questionId))) === null;
  const scores = guessScores(rounds.map((r) => ({ question: questionOf(r), answers: r.answers })));

  return {
    me: { name: ctx.player.name, seat },
    partner: partner ? { name: partner.name } : null,
    inviteCode: partner ? null : ctx.couple.inviteCode,
    pack: { id: pack, title: packById(pack).title },
    round: latest ? buildRoundView(latest, questionOf(latest), latest.answers, seat, names) : null,
    next:
      after.kind === 'tomorrow'
        ? { kind: 'tomorrow', inMs: msUntilNextDay(ctx.couple.timeZone, now) }
        : after.kind === 'open' && exhausted
          ? { kind: 'all_answered' }
          : after,
    streak: currentStreak(revealDays(rounds, ctx.couple.timeZone), today),
    guesses: { mine: scores[seat], theirs: scores[seat === 0 ? 1 : 0] },
  };
}

export type NextQuestionResult = { kind: 'opened' } | { kind: 'not_yet' };

/** "Next question" after a reveal: opens one when the schedule allows (the first day's extras). */
export async function openNextQuestion(db: Db, ctx: PlayerContext, now: Date = new Date()): Promise<NextQuestionResult> {
  const rounds = await loadRounds(db, ctx);
  return (await openRoundIfDue(db, ctx, rounds, now, 'requested')) ? { kind: 'opened' } : { kind: 'not_yet' };
}

export type AnswerResult =
  | { kind: 'answered' }
  | { kind: 'not_found' }
  | { kind: 'not_current' }
  | { kind: 'already_answered' }
  | { kind: 'wrong_kind' }
  | { kind: 'bad_option' };

export async function submitAnswer(db: Db, ctx: PlayerContext, input: AnswerInput, now: Date = new Date()): Promise<AnswerResult> {
  const round = await db.round.findFirst({
    where: { id: input.roundId, coupleId: ctx.couple.id },
    include: { answers: true },
  });
  if (!round) return { kind: 'not_found' };
  const latest = await db.round.findFirst({ where: { coupleId: ctx.couple.id }, orderBy: { number: 'desc' }, select: { id: true } });
  if (latest?.id !== round.id) return { kind: 'not_current' };
  const question = questionById(round.questionId);
  if (!question || question.kind !== input.kind) return { kind: 'wrong_kind' };

  const seat = seatOf(ctx.player);
  let data: { choice?: number; guess?: number; text?: string };
  if (input.kind === 'pick' && question.kind === 'pick') {
    if (input.choice >= question.options.length || input.guess >= question.options.length) return { kind: 'bad_option' };
    data = { choice: toStoredChoice(question, seat, input.choice), guess: toStoredChoice(question, seat, input.guess) };
  } else if (input.kind === 'open') {
    data = { text: input.text };
  } else {
    return { kind: 'wrong_kind' };
  }

  let answerId: string;
  try {
    answerId = (await db.answer.create({ data: { roundId: round.id, playerId: ctx.player.id, createdAt: now, ...data } })).id;
  } catch (error) {
    if (isUniqueViolation(error)) return { kind: 'already_answered' };
    throw error;
  }

  const pack = isPackId(ctx.couple.packId) ? ctx.couple.packId : DEFAULT_PACK;
  reportQuestionAnswered(answerId, ctx.player.id, { seat, kind: question.kind, pack, roundNumber: round.number });
  const other = round.answers.find((a) => a.playerId !== ctx.player.id);
  if (other) {
    // Seen after our own insert: the round is revealed now. (If both inserts
    // race, each misses the other and the event is lost; the reveal itself is
    // derived on read, so the game is unaffected.)
    const matched = question.kind === 'pick' ? other.choice === data.choice : null;
    reportRoundRevealed(ctx.couple.id, round.id, { kind: question.kind, roundNumber: round.number, matched });
  }
  return { kind: 'answered' };
}

export interface PastRound {
  view: RoundView;
  revealedOn: string;
}

/** Every revealed round, newest first. */
export async function loadPast(db: Db, ctx: PlayerContext): Promise<PastRound[]> {
  const rounds = await loadRounds(db, ctx);
  const seat = seatOf(ctx.player);
  const names = namesOf(ctx.couple.players);
  return rounds
    .filter((r) => r.answers.length >= 2)
    .reverse()
    .map((r) => ({
      view: buildRoundView(r, questionOf(r), r.answers, seat, names),
      revealedOn: dayKeyIn(ctx.couple.timeZone, revealedAt(r.answers)!),
    }));
}

export type PackResult = { kind: 'chosen' } | { kind: 'unknown_pack' };

/** Takes effect from the next round; the one on screen keeps its question. */
export async function choosePack(db: Db, ctx: PlayerContext, packId: string): Promise<PackResult> {
  if (!isPackId(packId) || packAccess(packById(packId)) !== 'open') return { kind: 'unknown_pack' };
  if (ctx.couple.packId !== packId) {
    await db.couple.update({ where: { id: ctx.couple.id }, data: { packId } });
    reportPackChosen(ctx.couple.id, packId);
  }
  return { kind: 'chosen' };
}

/** Deletes the couple and everything in it, for both of you. */
export async function endCouple(db: Db, ctx: PlayerContext): Promise<void> {
  const rounds = await loadRounds(db, ctx);
  await db.couple.deleteMany({ where: { id: ctx.couple.id } });
  reportCoupleEnded(ctx.couple.id, rounds.filter((r) => r.answers.length >= 2).length);
}
