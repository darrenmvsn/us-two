import { cookies } from 'next/headers';
import { resolvePlayer, type PlayerContext } from '@/lib/couple/game';
import { PLAYER_COOKIE, PLAYER_COOKIE_MAX_AGE, looksLikePlayerToken } from '@/lib/couple/player-token';
import { prisma } from '@/lib/prisma';

/** The player this request's cookie names, or null. For route handlers and server components. */
export async function currentPlayer(): Promise<PlayerContext | null> {
  const token = (await cookies()).get(PLAYER_COOKIE)?.value;
  if (!looksLikePlayerToken(token)) return null;
  return resolvePlayer(prisma, token);
}

export async function setPlayerCookie(token: string): Promise<void> {
  (await cookies()).set(PLAYER_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: PLAYER_COOKIE_MAX_AGE,
  });
}

export async function clearPlayerCookie(): Promise<void> {
  (await cookies()).delete(PLAYER_COOKIE);
}
