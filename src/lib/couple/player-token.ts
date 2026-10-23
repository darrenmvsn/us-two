import { createHash, randomBytes } from 'node:crypto';

/**
 * A player is whoever holds the token. The cookie carries 32 random bytes;
 * the database keeps only their sha256, so a database read cannot sign
 * anyone in.
 */
export const PLAYER_COOKIE = 'us_two_player';
/** About 400 days, the longest a browser keeps a cookie. */
export const PLAYER_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

export function newPlayerToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashPlayerToken(token) };
}

export function hashPlayerToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function looksLikePlayerToken(value: string | undefined): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
}

/** Invite codes: 10 characters from an alphabet with no look-alikes (no 0/O, 1/l/I). */
const INVITE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export const INVITE_CODE = /^[a-hjkmnp-z2-9]{10}$/;

export function newInviteCode(): string {
  const bytes = randomBytes(10);
  return Array.from(bytes, (b) => INVITE_ALPHABET[b % INVITE_ALPHABET.length]).join('');
}
