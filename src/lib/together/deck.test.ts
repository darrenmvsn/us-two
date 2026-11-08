import { describe, expect, it } from 'vitest';
import { PACKS, questionsIn } from '@/lib/questions/packs';
import { ME, PARTNER } from '@/lib/questions/types';
import { resumeIndex, togetherCard, togetherDeck, togetherPacks } from './deck';

describe('togetherCard', () => {
  it('keeps an open question as it is', () => {
    expect(togetherCard({ id: 'q-1', kind: 'open', prompt: 'Best day?' })).toEqual({ id: 'q-1', prompt: 'Best day?', options: [] });
  });

  it('keeps the options of a pick question that names no person', () => {
    const card = togetherCard({ id: 'q-2', kind: 'pick', prompt: 'Holiday?', options: ['Beach', 'City'] });
    expect(card.options).toEqual(['Beach', 'City']);
  });

  it('drops every option of a question that names a person, since both of you are reading one phone', () => {
    const card = togetherCard({ id: 'q-3', kind: 'pick', prompt: 'Who says sorry first?', options: [ME, PARTNER, 'Whoever is hungrier'] });
    expect(card.options).toEqual([]);
  });
});

describe('togetherDeck', () => {
  it('has one card per question, in catalogue order, and never shows a person token', () => {
    for (const pack of PACKS) {
      const deck = togetherDeck(pack.id);
      expect(deck.map((c) => c.id)).toEqual(questionsIn(pack.id).map((q) => q.id));
      for (const card of deck) expect(card.options.some((o) => o === ME || o === PARTNER)).toBe(false);
    }
  });
});

describe('togetherPacks', () => {
  it('offers every open pack', () => {
    expect(togetherPacks().map((p) => p.id)).toEqual(PACKS.map((p) => p.id));
  });
});

describe('resumeIndex', () => {
  it.each([
    [3, 10, 3],
    [10, 10, 10],
    [12, 10, 10],
    [-1, 10, 0],
    [2.5, 10, 0],
    ['3', 10, 0],
    [null, 10, 0],
    [4, 0, 0],
  ])('saved %p in a deck of %p resumes at %p', (saved, length, expected) => {
    expect(resumeIndex(saved, length)).toBe(expected);
  });
});
