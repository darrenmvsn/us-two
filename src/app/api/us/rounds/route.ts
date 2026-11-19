import { openNextQuestion } from '@/lib/couple/game';
import { routeLimits } from '@/lib/http/limits';
import { currentPlayer } from '@/lib/http/player-session';
import { clientKey } from '@/lib/http/rate-limit';
import { crossSiteRefused, errorResponse, isCrossSite, noContent, rateLimited, signedOut } from '@/lib/http/responses';
import { prisma } from '@/lib/prisma';
import { guardRoute } from '@/lib/server/unexpected-error';

/** "Next question": opens the next round when the day still has one. */
export const POST = guardRoute(async function POST(request: Request) {
  if (!routeLimits.play.allow(clientKey(request))) return rateLimited();
  if (isCrossSite(request)) return crossSiteRefused();
  const ctx = await currentPlayer();
  if (!ctx) return signedOut();
  const result = await openNextQuestion(prisma, ctx);
  switch (result.kind) {
    case 'opened':
      return noContent();
    case 'not_yet':
      return errorResponse(409, 'not_yet', 'The next question comes tomorrow.');
  }
});
