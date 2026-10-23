import type { DayKey } from './day';
import { DEFAULT_PACK, questionsIn, type PackId } from '@/lib/questions/packs';
import { QUESTIONS_BY_PACK } from '@/lib/questions/catalog';

/**
 * When a couple gets its next question. One a day, except the couple's first
 * day, which has three so a new pair gets a real game straight away. A new
 * round never opens while the last one is waiting on an answer.
 */
export const FIRST_DAY_QUESTIONS = 3;
export const DAILY_QUESTIONS = 1;

export interface RoundSummary {
  dayKey: DayKey;
  answerCount: number;
}

export type NextRound = { kind: 'open' } | { kind: 'waiting_on_answers' } | { kind: 'tomorrow' };

/** `rounds` oldest first. */
export function nextRound(rounds: readonly RoundSummary[], today: DayKey, firstDay: DayKey): NextRound {
  const last = rounds.at(-1);
  if (!last) return { kind: 'open' };
  if (last.answerCount < 2) return { kind: 'waiting_on_answers' };
  const allowance = today === firstDay ? FIRST_DAY_QUESTIONS : DAILY_QUESTIONS;
  const openedToday = rounds.filter((r) => r.dayKey === today).length;
  return openedToday < allowance ? { kind: 'open' } : { kind: 'tomorrow' };
}

/**
 * The next question for a couple: the first unused one in their pack, then in
 * the default pack, then anywhere. `null` once they have answered everything.
 */
export function nextQuestionId(pack: PackId, used: ReadonlySet<string>): string | null {
  const order: PackId[] = [pack, DEFAULT_PACK, ...(Object.keys(QUESTIONS_BY_PACK) as PackId[])];
  for (const p of order) {
    const q = questionsIn(p).find((candidate) => !used.has(candidate.id));
    if (q) return q.id;
  }
  return null;
}
