import { describe, expect, it } from 'vitest';
import { APP_NAME } from '@/lib/brand';
import { duelPlayed, duelRevealed, partnerAnswered, partnerJoined, roundRevealed } from './messages';

describe('nudge messages', () => {
  it('name the partner and the game, and open the game', () => {
    for (const message of [partnerJoined('Sam'), partnerAnswered('Sam'), roundRevealed('Sam')]) {
      expect(message).toMatchObject({ title: APP_NAME, url: '/us', tag: 'today' });
      expect(message.body).toContain('Sam');
    }
    expect(duelPlayed('Sam', 'Food', 'd1')).toMatchObject({ url: '/us/this-or-that/d1', tag: 'duel:d1' });
    expect(duelRevealed('Sam', 'Food', 'd1').body).toBe('Sam played Food too. See how many you matched.');
  });

  it('take no answer, pick or score: only a name, a set title and an id', () => {
    // The builders' parameters are the whole of what a lock screen can show.
    expect([partnerJoined, partnerAnswered, roundRevealed].map((f) => f.length)).toEqual([1, 1, 1]);
    expect([duelPlayed, duelRevealed].map((f) => f.length)).toEqual([3, 3]);
    expect(JSON.stringify(duelRevealed('Sam', 'Food', 'd1'))).not.toMatch(/\d+ of \d+/);
  });
});
