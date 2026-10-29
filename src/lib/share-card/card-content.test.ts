import { describe, expect, it } from 'vitest';
import type { PlayerContext } from '@/lib/couple/game';
import type { RoundView } from '@/lib/couple/views';
import type { DuelView } from '@/lib/this-or-that/duels';
import { CARD_TEXT_MAX, cardPeople, clampCardText, duelCardContent, roundCardContent } from './card-content';

const people = { me: 'Alex', partner: 'Sam' };

const duel: DuelView = {
  id: 'd1',
  set: { id: 'food', title: 'Food', items: Array.from({ length: 10 }, (_, i) => [`a${i}`, `b${i}`] as const) },
  state: 'revealed',
  startedByMe: true,
  mine: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  theirs: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
  matched: 7,
  verdict: 'Mostly in sync',
};

const pickRound: RoundView = {
  id: 'r1',
  number: 3,
  question: { kind: 'pick', prompt: 'Who is the funnier one?', options: ['Me', 'Sam'] },
  state: 'revealed',
  mine: { kind: 'pick', choice: 'Me', guess: 'Me', guessedRight: true },
  theirs: { kind: 'pick', choice: 'Sam', guess: 'Me', guessedRight: false },
  matched: false,
};

const openRound: RoundView = {
  id: 'r2',
  number: 2,
  question: { kind: 'open', prompt: 'What song makes you think of us?' },
  state: 'revealed',
  mine: { kind: 'open', text: 'Dancing   in the\nkitchen' },
  theirs: { kind: 'open', text: 'The one from the wedding' },
  matched: null,
};

describe('clampCardText', () => {
  it('flattens whitespace and keeps short text whole', () => {
    expect(clampCardText('  a\n\n b  ')).toBe('a b');
    expect(clampCardText('x'.repeat(CARD_TEXT_MAX))).toHaveLength(CARD_TEXT_MAX);
  });

  it('cuts long text at a word, with an ellipsis, within the limit', () => {
    const text = 'one two three four five six';
    expect(clampCardText(text, 20)).toBe('one two three four…');
    expect(clampCardText('word '.repeat(100)).length).toBeLessThanOrEqual(CARD_TEXT_MAX);
  });

  it('cuts mid-word when the last space is too early', () => {
    expect(clampCardText(`a ${'x'.repeat(40)}`, 20)).toBe(`a ${'x'.repeat(17)}…`);
  });
});

describe('duelCardContent', () => {
  it('names both of you and the score', () => {
    expect(duelCardContent(duel, people)).toEqual({
      kind: 'duel',
      eyebrow: 'This or that · Food',
      matched: 7,
      total: 10,
      headline: 'Alex and Sam matched 7 of 10',
      verdict: 'Mostly in sync',
      people,
    });
  });

  it('is null until both have played', () => {
    expect(duelCardContent({ ...duel, state: 'waiting', theirs: null, matched: null, verdict: null }, people)).toBeNull();
    expect(duelCardContent({ ...duel, state: 'play', mine: null, theirs: null, matched: null, verdict: null }, people)).toBeNull();
  });
});

describe('roundCardContent', () => {
  it('turns "Me" into the viewer\'s name on a pick', () => {
    expect(roundCardContent(pickRound, people)).toEqual({
      kind: 'round',
      eyebrow: 'Question 3',
      prompt: 'Who is the funnier one?',
      bubbles: [
        { who: 'you', name: 'Alex', label: 'Alex picked', text: 'Alex' },
        { who: 'them', name: 'Sam', label: 'Sam picked', text: 'Sam' },
      ],
      matched: false,
      people,
    });
  });

  it('shows open answers under each name, flattened and clamped', () => {
    const card = roundCardContent({ ...openRound, theirs: { kind: 'open', text: 'long '.repeat(80) } }, people)!;
    expect(card.bubbles[0]).toEqual({ who: 'you', name: 'Alex', label: 'Alex', text: 'Dancing in the kitchen' });
    expect(card.bubbles[1].text.length).toBeLessThanOrEqual(CARD_TEXT_MAX);
    expect(card.bubbles[1].text.endsWith('…')).toBe(true);
    expect(card.matched).toBe(false);
  });

  it('is null until revealed', () => {
    expect(roundCardContent({ ...openRound, state: 'waiting', theirs: null }, people)).toBeNull();
    expect(roundCardContent({ ...openRound, state: 'answer', mine: null, theirs: null }, people)).toBeNull();
  });
});

describe('cardPeople', () => {
  const alex = { id: 'p0', name: 'Alex' };
  const sam = { id: 'p1', name: 'Sam' };
  const ctx = (players: { id: string; name: string }[]) => ({ player: alex, couple: { players } }) as unknown as PlayerContext;

  it('names the viewer and the partner', () => {
    expect(cardPeople(ctx([alex, sam]))).toEqual({ me: 'Alex', partner: 'Sam' });
  });

  it('falls back to a placeholder before the partner joins', () => {
    expect(cardPeople(ctx([alex]))).toEqual({ me: 'Alex', partner: 'Your partner' });
  });
});
