import { createFixedWindowLimiter } from './rate-limit';

/** Per-client limits, keyed on the address Caddy forwards (`clientKey`). */
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const routeLimits = {
  /** New games: generous for a household sharing an address, tight for a script. */
  startCouple: createFixedWindowLimiter({ limit: 20, windowMs: HOUR }),
  /** Joining also covers guessing invite codes, which are 31^10 to one. */
  joinCouple: createFixedWindowLimiter({ limit: 30, windowMs: HOUR }),
  /** Using a "link another phone" code, which also covers guessing them. */
  linkPhone: createFixedWindowLimiter({ limit: 30, windowMs: HOUR }),
  /** Share cards: each one is drawn on demand, so a few a minute is plenty. */
  shareCard: createFixedWindowLimiter({ limit: 20, windowMs: MINUTE }),
  /** Writes inside a game. */
  play: createFixedWindowLimiter({ limit: 60, windowMs: MINUTE }),
  /** Reads, including the waiting screen's poll every few seconds. */
  read: createFixedWindowLimiter({ limit: 120, windowMs: MINUTE }),
};
