import { describe, expect, it } from 'vitest';
import { ME, PARTNER, type Question } from '@/lib/questions/types';
import { buildRoundView, guessScores, revealedAt, type StoredAnswer } from './views';

const funnier: Question = { id: 'q1', kind: 'pick', prompt: 'Who is funnier?', options: [ME, PARTNER] };
const deep: Question = { id: 'q2', kind: 'open', prompt: 'When do you feel loved?' };
const names = { seat0: 'Alex', seat1: 'Sam' };
const round = { id: 'r1', number: 1 };
const at = (min: number) => new Date(Date.UTC(2026, 9, 22, 10, min));
// Stored in seat 0's frame: index 0 is Alex, 1 is Sam.
const alex: StoredAnswer = { seat: 0, choice: 0, guess: 1, text: null, createdAt: at(1) };
const sam: StoredAnswer = { seat: 1, choice: 0, guess: 0, text: null, createdAt: at(5) };

describe('buildRoundView', () => {
  it('asks a player who has not answered, with people named from their side', () => {
    const view = buildRoundView(round, funnier, [], 1, names);
    expect(view.state).toBe('answer');
    expect(view.question).toEqual({ kind: 'pick', prompt: 'Who is funnier?', options: ['Me', 'Alex'] });
  });

  it('names the partner by placeholder before they join', () => {
    expect(buildRoundView(round, funnier, [], 0, { seat0: 'Alex', seat1: null }).question).toMatchObject({ options: ['Me', 'Your partner'] });
  });

  it('never includes the partner answer before you have answered', () => {
    const view = buildRoundView(round, funnier, [sam], 0, names);
    expect(view.state).toBe('answer');
    expect(view.theirs).toBeNull();
    expect(JSON.stringify(view)).not.toContain('guessedRight":true');
  });

  it('keeps it hidden while you wait for them', () => {
    const view = buildRoundView(round, funnier, [alex], 0, names);
    expect(view.state).toBe('waiting');
    expect(view.mine).toEqual({ kind: 'pick', choice: 'Me', guess: 'Sam', guessedRight: null });
    expect(view.theirs).toBeNull();
  });

  it('reveals both, scores the guesses and the match', () => {
    const view = buildRoundView(round, funnier, [alex, sam], 0, names);
    expect(view.state).toBe('revealed');
    expect(view.matched).toBe(true);
    expect(view.mine).toEqual({ kind: 'pick', choice: 'Me', guess: 'Sam', guessedRight: false });
    expect(view.theirs).toEqual({ kind: 'pick', choice: 'Me', guess: 'Me', guessedRight: true });
  });

  it('shows open answers as written', () => {
    const a: StoredAnswer = { seat: 0, choice: null, guess: null, text: 'Coffee in bed', createdAt: at(1) };
    const b: StoredAnswer = { seat: 1, choice: null, guess: null, text: 'Long walks', createdAt: at(2) };
    const view = buildRoundView(round, deep, [a, b], 1, names);
    expect(view.mine).toEqual({ kind: 'open', text: 'Long walks' });
    expect(view.theirs).toEqual({ kind: 'open', text: 'Coffee in bed' });
    expect(view.matched).toBeNull();
  });
});

describe('scores', () => {
  it('times a reveal by the later answer', () => {
    expect(revealedAt([alex])).toBeNull();
    expect(revealedAt([alex, sam])).toEqual(at(5));
  });

  it('counts right guesses per seat over revealed pick rounds', () => {
    expect(guessScores([{ question: funnier, answers: [alex, sam] }, { question: funnier, answers: [alex] }])).toEqual({
      0: { right: 0, total: 1 },
      1: { right: 1, total: 1 },
    });
  });
});
