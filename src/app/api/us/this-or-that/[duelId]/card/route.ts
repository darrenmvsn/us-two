import { routeLimits } from '@/lib/http/limits';
import { currentPlayer } from '@/lib/http/player-session';
import { clientKey } from '@/lib/http/rate-limit';
import { errorResponse, rateLimited, signedOut } from '@/lib/http/responses';
import { prisma } from '@/lib/prisma';
import { cardPeople, duelCardContent } from '@/lib/share-card/card-content';
import { renderShareCard } from '@/lib/share-card/render';
import { loadDuel } from '@/lib/this-or-that/duels';

/** A This or that score as a story-sized PNG, once both of you have played. */
export async function GET(request: Request, ctx: RouteContext<'/api/us/this-or-that/[duelId]/card'>) {
  if (!routeLimits.shareCard.allow(clientKey(request))) return rateLimited();
  const player = await currentPlayer();
  if (!player) return signedOut();
  const { duelId } = await ctx.params;
  const duel = await loadDuel(prisma, player, duelId);
  const card = duel ? duelCardContent(duel, cardPeople(player)) : null;
  return card ? renderShareCard(card) : errorResponse(404, 'not_found');
}
