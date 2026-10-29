import { loadRevealedRound } from '@/lib/couple/game';
import { routeLimits } from '@/lib/http/limits';
import { currentPlayer } from '@/lib/http/player-session';
import { clientKey } from '@/lib/http/rate-limit';
import { errorResponse, rateLimited, signedOut } from '@/lib/http/responses';
import { prisma } from '@/lib/prisma';
import { cardPeople, roundCardContent } from '@/lib/share-card/card-content';
import { renderShareCard } from '@/lib/share-card/render';

/** A revealed question, both answers side by side, as a story-sized PNG. */
export async function GET(request: Request, ctx: RouteContext<'/api/us/rounds/[roundId]/card'>) {
  if (!routeLimits.shareCard.allow(clientKey(request))) return rateLimited();
  const player = await currentPlayer();
  if (!player) return signedOut();
  const { roundId } = await ctx.params;
  const round = await loadRevealedRound(prisma, player, roundId);
  const card = round ? roundCardContent(round, cardPeople(player)) : null;
  return card ? renderShareCard(card) : errorResponse(404, 'not_found');
}
