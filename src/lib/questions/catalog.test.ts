import { describe, expect, it } from 'vitest';
import { QUESTIONS_BY_PACK } from './catalog';
import { PACKS, isPackId, questionById } from './packs';

const all = Object.values(QUESTIONS_BY_PACK).flat();

describe('the question catalog', () => {
  it('has a listing for every pack and a pack for every listing', () => {
    expect(PACKS.map((p) => p.id).sort()).toEqual(Object.keys(QUESTIONS_BY_PACK).sort());
    expect(PACKS.every((p) => isPackId(p.id))).toBe(true);
  });

  it('never repeats an id', () => {
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
  });

  it('gives each pick question two to four distinct options', () => {
    for (const q of all) {
      if (q.kind !== 'pick') continue;
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.options.length, q.id).toBeLessThanOrEqual(4);
      expect(new Set(q.options).size, q.id).toBe(q.options.length);
    }
  });

  it('keeps every prompt short enough for a phone and a slideshow', () => {
    for (const q of all) expect(q.prompt.length, q.id).toBeLessThanOrEqual(90);
  });

  it('finds questions by id', () => {
    expect(questionById('everyday-001')?.kind).toBe('pick');
    expect(questionById('nope')).toBeUndefined();
  });

  it('starts the default pack with a pick question, so the first round has a guess to score', () => {
    expect(QUESTIONS_BY_PACK.everyday[0]?.kind).toBe('pick');
  });
});
