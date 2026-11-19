import { describe, expect, it } from 'vitest';
import { SLOW_AFTER_MS, SLOW_INTERVAL_MS, pollDelay } from './use-poll';

describe('pollDelay', () => {
  it('polls at the asked pace for the first two minutes', () => {
    expect(pollDelay(5_000, 0)).toBe(5_000);
    expect(pollDelay(5_000, SLOW_AFTER_MS - 1)).toBe(5_000);
  });

  it('slows down after that', () => {
    expect(pollDelay(5_000, SLOW_AFTER_MS)).toBe(SLOW_INTERVAL_MS);
    expect(pollDelay(5_000, 60 * 60_000)).toBe(SLOW_INTERVAL_MS);
  });

  it('never polls faster than asked', () => {
    expect(pollDelay(60_000, SLOW_AFTER_MS)).toBe(60_000);
  });
});
