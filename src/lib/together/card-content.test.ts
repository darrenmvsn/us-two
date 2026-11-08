import { describe, expect, it } from 'vitest';
import { cardFormat, togetherCardContent } from './card-content';

describe('togetherCardContent', () => {
  it('draws a cover with the pack and its card count', () => {
    expect(togetherCardContent('deep', 'cover')).toEqual({ kind: 'cover', packTitle: 'Deep', count: 16, tint: 'lilac' });
  });

  it('draws a question with its place in the pack, and no person options', () => {
    const card = togetherCardContent('everyday', 'everyday-003');
    expect(card).toMatchObject({ kind: 'question', prompt: 'Who would survive longer in a zombie film?', options: [], number: 3, total: 30 });
  });

  it('keeps the options of a plain pick', () => {
    expect(togetherCardContent('everyday', 'everyday-001')).toMatchObject({ options: ['Brunch somewhere new', 'Never leaving bed', 'A long walk', 'Friends over'] });
  });

  it('refuses an unknown pack, a question from another pack, and an unknown card', () => {
    expect(togetherCardContent('nope', 'cover')).toBeNull();
    expect(togetherCardContent('deep', 'everyday-001')).toBeNull();
    expect(togetherCardContent('deep', 'deep-999')).toBeNull();
  });
});

describe('cardFormat', () => {
  it.each([
    [null, 'story'],
    ['story', 'story'],
    ['post', 'post'],
    ['square', null],
  ])('%p reads as %p', (value, expected) => {
    expect(cardFormat(value)).toBe(expected);
  });
});
