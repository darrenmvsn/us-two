import { optionLabel, toSeenChoice, type Seat } from '@/lib/questions/perspective';
import type { PickQuestion, Question } from '@/lib/questions/types';

/**
 * What one player may see of a round. The partner's answer is left out until
 * both of you have answered: the server never sends it early, so it cannot
 * be read from the network tab either.
 */

export interface StoredAnswer {
  seat: Seat;
  choice: number | null;
  guess: number | null;
  text: string | null;
  createdAt: Date;
}

export interface Names {
  seat0: string;
  /** Null until the partner joins. */
  seat1: string | null;
}

export type AnswerView =
  | { kind: 'pick'; choice: string; guess: string; guessedRight: boolean | null }
  | { kind: 'open'; text: string };

export interface RoundView {
  id: string;
  number: number;
  question: { kind: 'open'; prompt: string } | { kind: 'pick'; prompt: string; options: string[] };
  state: 'answer' | 'waiting' | 'revealed';
  mine: AnswerView | null;
  theirs: AnswerView | null;
  /** Pick rounds once revealed: did you both pick the same? */
  matched: boolean | null;
}

export const PARTNER_PLACEHOLDER = 'Your partner';

function labelNames(names: Names, viewerSeat: Seat) {
  return { viewerSeat, seat0: names.seat0, seat1: names.seat1 ?? PARTNER_PLACEHOLDER };
}

/** The options in the order this viewer sees them, with people named from their side. */
export function seenOptions(question: PickQuestion, viewerSeat: Seat, names: Names): string[] {
  return question.options.map((_, seen) =>
    optionLabel(question, toSeenChoice(question, viewerSeat, seen), labelNames(names, viewerSeat)),
  );
}

function answerView(question: Question, answer: StoredAnswer, other: StoredAnswer | undefined, viewerSeat: Seat, names: Names): AnswerView {
  if (question.kind === 'open') return { kind: 'open', text: answer.text ?? '' };
  const label = (stored: number | null) => (stored === null ? '' : optionLabel(question, stored, labelNames(names, viewerSeat)));
  return {
    kind: 'pick',
    choice: label(answer.choice),
    guess: label(answer.guess),
    guessedRight: other ? answer.guess === other.choice : null,
  };
}

export function buildRoundView(
  round: { id: string; number: number },
  question: Question,
  answers: readonly StoredAnswer[],
  viewerSeat: Seat,
  names: Names,
): RoundView {
  const mine = answers.find((a) => a.seat === viewerSeat);
  const theirs = answers.find((a) => a.seat !== viewerSeat);
  const revealed = Boolean(mine && theirs);
  return {
    id: round.id,
    number: round.number,
    question:
      question.kind === 'pick'
        ? { kind: 'pick', prompt: question.prompt, options: seenOptions(question, viewerSeat, names) }
        : { kind: 'open', prompt: question.prompt },
    state: revealed ? 'revealed' : mine ? 'waiting' : 'answer',
    mine: mine ? answerView(question, mine, revealed ? theirs : undefined, viewerSeat, names) : null,
    theirs: revealed && theirs ? answerView(question, theirs, mine, viewerSeat, names) : null,
    matched: revealed && question.kind === 'pick' ? mine!.choice === theirs!.choice : null,
  };
}

/** The moment a round was revealed: the later of the two answers. */
export function revealedAt(answers: readonly StoredAnswer[]): Date | null {
  if (answers.length < 2) return null;
  return new Date(Math.max(...answers.map((a) => a.createdAt.getTime())));
}

/** Guesses right out of guesses scored, per seat, over revealed pick rounds. */
export function guessScores(rounds: readonly { question: Question; answers: readonly StoredAnswer[] }[]): Record<Seat, { right: number; total: number }> {
  const score = { 0: { right: 0, total: 0 }, 1: { right: 0, total: 0 } };
  for (const { question, answers } of rounds) {
    if (question.kind !== 'pick' || answers.length < 2) continue;
    for (const a of answers) {
      const other = answers.find((b) => b.seat !== a.seat);
      if (!other) continue;
      score[a.seat].total += 1;
      if (a.guess === other.choice) score[a.seat].right += 1;
    }
  }
  return score;
}
