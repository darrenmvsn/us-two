import { describe, expect, it } from 'vitest';
import { optionLabel, toSeenChoice, toStoredChoice } from './perspective';
import { ME, PARTNER, type PickQuestion } from './types';

const funnier: PickQuestion = { id: 't-1', kind: 'pick', prompt: 'Who is funnier?', options: [ME, PARTNER] };
const cook: PickQuestion = { id: 't-2', kind: 'pick', prompt: 'Who cooks?', options: [ME, PARTNER, 'Neither'] };
const sunday: PickQuestion = { id: 't-3', kind: 'pick', prompt: 'Sunday?', options: ['Brunch', 'Bed'] };
const names = { seat0: 'Alex', seat1: 'Sam' };

describe('perspective', () => {
  it('stores seat 0 as seen', () => {
    expect(toStoredChoice(funnier, 0, 0)).toBe(0);
    expect(toStoredChoice(funnier, 0, 1)).toBe(1);
  });

  it('swaps "me" and the partner for seat 1, so both naming Alex match', () => {
    const alexPicksHimself = toStoredChoice(funnier, 0, 0);
    const samPicksAlex = toStoredChoice(funnier, 1, 1);
    expect(alexPicksHimself).toBe(samPicksAlex);
  });

  it('leaves other options alone', () => {
    expect(toStoredChoice(cook, 1, 2)).toBe(2);
    expect(toStoredChoice(sunday, 1, 1)).toBe(1);
  });

  it('round-trips', () => {
    for (const seen of [0, 1, 2]) expect(toSeenChoice(cook, 1, toStoredChoice(cook, 1, seen))).toBe(seen);
  });

  it('labels people from the viewer side', () => {
    expect(optionLabel(funnier, 0, { ...names, viewerSeat: 0 })).toBe('Me');
    expect(optionLabel(funnier, 0, { ...names, viewerSeat: 1 })).toBe('Alex');
    expect(optionLabel(funnier, 1, { ...names, viewerSeat: 1 })).toBe('Me');
    expect(optionLabel(cook, 2, { ...names, viewerSeat: 1 })).toBe('Neither');
  });
});
