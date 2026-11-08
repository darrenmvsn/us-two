import { QUESTIONS_BY_PACK } from './catalog';
import type { Question } from './types';

export type PackId = keyof typeof QUESTIONS_BY_PACK;

export interface Pack {
  id: PackId;
  title: string;
  blurb: string;
  /**
   * `plus` packs are the planned paid part. Every pack is free until a price
   * is set (team folder pricing.md); the flag is here so the paywall is one
   * check in `packAccess`, not a hunt through the UI.
   */
  tier: 'free' | 'plus';
  /**
   * `couple` packs are for the daily game and for playing together.
   * `anyone` packs (friends, siblings) are only played together on one
   * phone: the daily game is for a couple.
   */
  audience: 'couple' | 'anyone';
}

export const PACKS: readonly Pack[] = [
  { id: 'everyday', title: 'Everyday', blurb: 'Light, funny and a little sweet. The default.', tier: 'free', audience: 'couple' },
  { id: 'would-you-rather', title: 'Would you rather', blurb: 'Two options, no easy answers.', tier: 'plus', audience: 'couple' },
  { id: 'deep', title: 'Deep', blurb: 'For nights when you want a real talk.', tier: 'plus', audience: 'couple' },
  { id: 'future-us', title: 'Future us', blurb: 'Homes, trips, plans and the far future.', tier: 'plus', audience: 'couple' },
  { id: 'long-distance', title: 'Long distance', blurb: 'For couples in different places.', tier: 'plus', audience: 'couple' },
  { id: 'money-home', title: 'Money and home', blurb: 'Bills, chores and how you live together.', tier: 'plus', audience: 'couple' },
  { id: 'flirty', title: 'Flirty', blurb: 'Compliments, crushes and date nights.', tier: 'plus', audience: 'couple' },
  { id: 'late-night', title: 'Late night talks', blurb: 'Quiet questions for when the lights are off.', tier: 'plus', audience: 'couple' },
  { id: 'getting-to-know', title: 'Getting to know you', blurb: 'For the first few dates, from easy to real.', tier: 'plus', audience: 'couple' },
  { id: 'best-friends', title: 'Best friends', blurb: 'For you and your person who is not your partner.', tier: 'plus', audience: 'anyone' },
  { id: 'siblings', title: 'Siblings', blurb: 'Growing up together, and what comes next.', tier: 'plus', audience: 'anyone' },
];

/** The packs the daily game can use. */
export const COUPLE_PACKS: readonly Pack[] = PACKS.filter((pack) => pack.audience === 'couple');

export const DEFAULT_PACK: PackId = 'everyday';

export function isPackId(value: string): value is PackId {
  return Object.hasOwn(QUESTIONS_BY_PACK, value);
}

export function packById(id: PackId): Pack {
  const pack = PACKS.find((p) => p.id === id);
  if (!pack) throw new Error(`pack ${id} has no listing`);
  return pack;
}

export function questionsIn(pack: PackId): readonly Question[] {
  return QUESTIONS_BY_PACK[pack];
}

/** Every pack is open while there is no price; `plus` packs close here once there is. */
export function packAccess(_pack: Pack): 'open' {
  return 'open';
}

const BY_ID: ReadonlyMap<string, Question> = new Map(
  Object.values(QUESTIONS_BY_PACK).flatMap((questions) => questions.map((q) => [q.id, q] as const)),
);

export function questionById(id: string): Question | undefined {
  return BY_ID.get(id);
}
