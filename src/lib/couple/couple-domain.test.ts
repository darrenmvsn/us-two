import { describe, expect, it } from 'vitest';
import { dayKeyIn, isValidTimeZone, msUntilNextDay, previousDayKey } from './day';
import { nextQuestionId, nextRound } from './schedule';
import { currentStreak } from './streak';
import { QUESTIONS_BY_PACK } from '@/lib/questions/catalog';

describe('days', () => {
  it('reads the local date in the couple time zone', () => {
    const at = new Date('2026-10-22T20:00:00Z');
    expect(dayKeyIn('Australia/Sydney', at)).toBe('2026-10-23');
    expect(dayKeyIn('America/New_York', at)).toBe('2026-10-22');
  });

  it('steps back across months and years', () => {
    expect(previousDayKey('2026-03-01')).toBe('2026-02-28');
    expect(previousDayKey('2027-01-01')).toBe('2026-12-31');
  });

  it('validates zones', () => {
    expect(isValidTimeZone('Australia/Sydney')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });

  it('counts down to local midnight', () => {
    expect(msUntilNextDay('UTC', new Date('2026-10-22T23:00:00Z'))).toBe(3_600_000);
  });
});

describe('nextRound', () => {
  const first = '2026-10-22';
  it('opens the first round', () => {
    expect(nextRound([], first, first)).toEqual({ kind: 'open' });
  });

  it('waits while the last round is unanswered by one of you', () => {
    expect(nextRound([{ dayKey: first, answerCount: 1 }], first, first)).toEqual({ kind: 'waiting_on_answers' });
  });

  it('allows three on the first day, then one a day', () => {
    const done = (dayKey: string) => ({ dayKey, answerCount: 2 });
    expect(nextRound([done(first), done(first)], first, first).kind).toBe('open');
    expect(nextRound([done(first), done(first), done(first)], first, first).kind).toBe('tomorrow');
    expect(nextRound([done(first)], '2026-10-23', first).kind).toBe('open');
    expect(nextRound([done(first), done('2026-10-23')], '2026-10-23', first).kind).toBe('tomorrow');
  });
});

describe('nextQuestionId', () => {
  it('takes the pack in order, then falls back', () => {
    expect(nextQuestionId('deep', new Set())).toBe('deep-001');
    const allDeep = new Set(QUESTIONS_BY_PACK.deep.map((q) => q.id));
    expect(nextQuestionId('deep', allDeep)).toBe('everyday-001');
  });

  it('returns null when every question is used', () => {
    const all = new Set(Object.values(QUESTIONS_BY_PACK).flat().map((q) => q.id));
    expect(nextQuestionId('everyday', all)).toBeNull();
  });
});

describe('currentStreak', () => {
  it('counts back from today, or from yesterday when today is not played yet', () => {
    const days = new Set(['2026-10-20', '2026-10-21', '2026-10-22']);
    expect(currentStreak(days, '2026-10-22')).toBe(3);
    expect(currentStreak(days, '2026-10-23')).toBe(3);
    expect(currentStreak(days, '2026-10-24')).toBe(0);
    expect(currentStreak(new Set(), '2026-10-22')).toBe(0);
  });
});
