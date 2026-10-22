import { describe, expect, it } from 'vitest';
import { PICKS_PER_SET, THIS_OR_THAT_SETS, matchCount, matchVerdict, thisOrThatSetById } from './sets';

describe('This or that sets', () => {
  it('has ten distinct two-way picks in every set and unique ids', () => {
    expect(new Set(THIS_OR_THAT_SETS.map((s) => s.id)).size).toBe(THIS_OR_THAT_SETS.length);
    for (const set of THIS_OR_THAT_SETS) {
      expect(set.items, set.id).toHaveLength(PICKS_PER_SET);
      for (const [a, b] of set.items) expect(a, set.id).not.toBe(b);
    }
  });

  it('finds a set by id', () => {
    expect(thisOrThatSetById('food')?.title).toBe('Food');
    expect(thisOrThatSetById('nope')).toBeUndefined();
  });

  it('counts matches position by position', () => {
    expect(matchCount([0, 1, 0, 1], [0, 0, 0, 1])).toBe(3);
    expect(matchCount([], [])).toBe(0);
  });

  it('names a score', () => {
    expect(matchVerdict(10)).toBe('Same brain.');
    expect(matchVerdict(8)).toBe('Practically twins.');
    expect(matchVerdict(6)).toBe('Mostly in sync.');
    expect(matchVerdict(4)).toBe('Opposites, a little.');
    expect(matchVerdict(0)).toBe('Opposites attract.');
  });
});
