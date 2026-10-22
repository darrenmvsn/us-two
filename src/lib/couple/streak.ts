import { previousDayKey, type DayKey } from './day';

/**
 * Days in a row on which the two of you both answered (a round was revealed).
 * A streak still counts on a day you haven't played yet: it ends only once a
 * whole day passes with nothing revealed.
 */
export function currentStreak(revealDays: ReadonlySet<DayKey>, today: DayKey): number {
  let day = revealDays.has(today) ? today : previousDayKey(today);
  let count = 0;
  while (revealDays.has(day)) {
    count += 1;
    day = previousDayKey(day);
  }
  return count;
}
