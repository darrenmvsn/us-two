import { routeLimits } from '@/lib/http/limits';
import { currentPlayer } from '@/lib/http/player-session';
import { clientKey } from '@/lib/http/rate-limit';
import { errorResponse, privateJson, rateLimited, signedOut } from '@/lib/http/responses';
import { prisma } from '@/lib/prisma';
import { loadDuel } from '@/lib/this-or-that/duels';

/** One This or that set from this player's side. Polled while waiting. */
export async function GET(request: Request, ctx: RouteContext<'/api/us/this-or-that/[duelId]'>) {
  if (!routeLimits.read.allow(clientKey(request))) return rateLimited();
  const player = await currentPlayer();
  if (!player) return signedOut();
  const { duelId } = await ctx.params;
  const duel = await loadDuel(prisma, player, duelId);
  return duel ? privateJson(duel) : errorResponse(404, 'not_found');
}
