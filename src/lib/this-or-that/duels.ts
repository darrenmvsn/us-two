import { Prisma } from '@prisma/client';
import type { Db } from '@/lib/prisma';
import type { PlayerContext } from '@/lib/couple/game';
import { duelPlayed, duelRevealed } from '@/lib/nudges/messages';
import { nudgePlayer } from '@/lib/nudges/send';
import { reportThisOrThatPlayed, reportThisOrThatRevealed } from '@/lib/analytics/product-events';
import { THIS_OR_THAT_SETS, matchCount, matchVerdict, thisOrThatSetById, type ThisOrThatSet } from './sets';

/**
 * This or that as a game between the two phones. One set is open at a time:
 * either of you starts it, each sends ten picks in one go, and the match
 * score shows once both have. Like the daily question, the partner's picks
 * never leave the server before yours are in.
 */

export interface DuelView {
  id: string;
  set: { id: string; title: string; items: readonly (readonly [string, string])[] };
  state: 'play' | 'waiting' | 'revealed';
  startedByMe: boolean;
  mine: number[] | null;
  theirs: number[] | null;
  matched: number | null;
  verdict: string | null;
}

export interface DuelSummary {
  id: string;
  setTitle: string;
  matched: number;
}

export interface ThisOrThatHome {
  open: DuelView | null;
  finished: DuelSummary[];
  sets: { id: string; title: string; played: boolean }[];
}

type LoadedDuel = Prisma.DuelGetPayload<{ include: { picks: true } }>;

function viewOf(duel: LoadedDuel, set: ThisOrThatSet, ctx: PlayerContext, startedByMe: boolean): DuelView {
  const mine = duel.picks.find((p) => p.playerId === ctx.player.id)?.choices ?? null;
  const theirsRow = duel.picks.find((p) => p.playerId !== ctx.player.id);
  const revealed = Boolean(mine && theirsRow);
  const matched = revealed ? matchCount(mine!, theirsRow!.choices) : null;
  return {
    id: duel.id,
    set: { id: set.id, title: set.title, items: set.items },
    state: revealed ? 'revealed' : mine ? 'waiting' : 'play',
    startedByMe,
    mine,
    theirs: revealed ? theirsRow!.choices : null,
    matched,
    verdict: matched === null ? null : matchVerdict(matched, set.items.length),
  };
}

function setOf(duel: { setId: string; id: string }): ThisOrThatSet {
  const set = thisOrThatSetById(duel.setId);
  if (!set) throw new Error(`duel ${duel.id} points at unknown set ${duel.setId}`);
  return set;
}

async function duelsOf(db: Db, ctx: PlayerContext): Promise<LoadedDuel[]> {
  return db.duel.findMany({ where: { coupleId: ctx.couple.id }, orderBy: { startedAt: 'desc' }, include: { picks: true } });
}

/** Who started a duel is whoever sent picks first, or, before any picks, unknown (treated as me). */
function startedByMe(duel: LoadedDuel, ctx: PlayerContext): boolean {
  const first = [...duel.picks].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  return !first || first.playerId === ctx.player.id;
}

export async function loadThisOrThat(db: Db, ctx: PlayerContext): Promise<ThisOrThatHome> {
  const duels = await duelsOf(db, ctx);
  const open = duels.find((d) => d.picks.length < 2);
  const finished = duels.filter((d) => d.picks.length >= 2);
  const playedSets = new Set(finished.map((d) => d.setId));
  return {
    open: open ? viewOf(open, setOf(open), ctx, startedByMe(open, ctx)) : null,
    finished: finished.slice(0, 20).map((d) => ({
      id: d.id,
      setTitle: setOf(d).title,
      matched: matchCount(d.picks[0]!.choices, d.picks[1]!.choices),
    })),
    sets: THIS_OR_THAT_SETS.map((s) => ({ id: s.id, title: s.title, played: playedSets.has(s.id) })),
  };
}

export async function loadDuel(db: Db, ctx: PlayerContext, duelId: string): Promise<DuelView | null> {
  const duel = await db.duel.findFirst({ where: { id: duelId, coupleId: ctx.couple.id }, include: { picks: true } });
  return duel ? viewOf(duel, setOf(duel), ctx, startedByMe(duel, ctx)) : null;
}

export type StartDuelResult = { kind: 'started'; duelId: string } | { kind: 'one_open'; duelId: string } | { kind: 'unknown_set' };

export async function startDuel(db: Db, ctx: PlayerContext, setId: string): Promise<StartDuelResult> {
  if (!thisOrThatSetById(setId)) return { kind: 'unknown_set' };
  // Serialise per couple, so two phones pressing Start at once open one set.
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`duel:${ctx.couple.id}`} || current_schema()))`;
    const duels = await tx.duel.findMany({
      where: { coupleId: ctx.couple.id },
      select: { id: true, _count: { select: { picks: true } } },
    });
    const unfinished = duels.find((d) => d._count.picks < 2);
    if (unfinished) return { kind: 'one_open', duelId: unfinished.id } as const;
    const duel = await tx.duel.create({ data: { coupleId: ctx.couple.id, setId } });
    return { kind: 'started', duelId: duel.id } as const;
  });
}

export type PicksResult = { kind: 'sent' } | { kind: 'not_found' } | { kind: 'already_sent' } | { kind: 'wrong_length' };

export async function submitPicks(db: Db, ctx: PlayerContext, duelId: string, choices: number[]): Promise<PicksResult> {
  const duel = await db.duel.findFirst({ where: { id: duelId, coupleId: ctx.couple.id }, include: { picks: true } });
  if (!duel) return { kind: 'not_found' };
  const set = setOf(duel);
  if (choices.length !== set.items.length) return { kind: 'wrong_length' };
  let picksId: string;
  try {
    picksId = (await db.duelPicks.create({ data: { duelId, playerId: ctx.player.id, choices } })).id;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return { kind: 'already_sent' };
    throw error;
  }
  const seat = ctx.player.seat === 1 ? 1 : 0;
  reportThisOrThatPlayed(picksId, ctx.player.id, seat, set.id);
  const other = duel.picks.find((p) => p.playerId !== ctx.player.id);
  if (other) {
    reportThisOrThatRevealed(ctx.couple.id, duel.id, set.id, matchCount(choices, other.choices));
    nudgePlayer(db, other.playerId, duelRevealed(ctx.player.name, set.title, duel.id));
  } else {
    const partner = ctx.couple.players.find((p) => p.id !== ctx.player.id);
    if (partner) nudgePlayer(db, partner.id, duelPlayed(ctx.player.name, set.title, duel.id));
  }
  return { kind: 'sent' };
}
