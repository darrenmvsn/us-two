import { cookies } from 'next/headers';
import { PLAYER_COOKIE, looksLikePlayerToken } from '@/lib/couple/player-token';

/**
 * Whether this phone carries a game cookie, without asking the database.
 * For pages that only pick a link by it (Together mode): they keep working
 * while the database is down, and a stale cookie costs one redirect home.
 */
export async function holdsPlayerCookie(): Promise<boolean> {
  return looksLikePlayerToken((await cookies()).get(PLAYER_COOKIE)?.value);
}
