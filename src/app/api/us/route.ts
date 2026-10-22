import { endCouple, loadHome } from '@/lib/couple/game';
import { routeLimits } from '@/lib/http/limits';
import { clearPlayerCookie, currentPlayer } from '@/lib/http/player-session';
import { clientKey } from '@/lib/http/rate-limit';
import { noContent, privateJson, rateLimited, signedOut } from '@/lib/http/responses';
import { prisma } from '@/lib/prisma';

/** Today's question, from this player's side. Polled while waiting on the partner. */
export async function GET(request: Request) {
  if (!routeLimits.read.allow(clientKey(request))) return rateLimited();
  const ctx = await currentPlayer();
  if (!ctx) return signedOut();
  return privateJson(await loadHome(prisma, ctx));
}

/** End the game and delete everything in it, for both players. */
export async function DELETE(request: Request) {
  if (!routeLimits.play.allow(clientKey(request))) return rateLimited();
  const ctx = await currentPlayer();
  if (!ctx) return signedOut();
  await endCouple(prisma, ctx);
  await clearPlayerCookie();
  return noContent();
}
