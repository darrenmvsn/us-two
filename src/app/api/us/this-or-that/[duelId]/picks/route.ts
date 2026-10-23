import { duelPicksSchema, firstIssue } from '@/lib/couple/inputs';
import { routeLimits } from '@/lib/http/limits';
import { currentPlayer } from '@/lib/http/player-session';
import { clientKey } from '@/lib/http/rate-limit';
import { errorResponse, noContent, rateLimited, readJson, signedOut } from '@/lib/http/responses';
import { prisma } from '@/lib/prisma';
import { submitPicks } from '@/lib/this-or-that/duels';

/** Send all ten picks for a set at once. Final. */
export async function POST(request: Request, ctx: RouteContext<'/api/us/this-or-that/[duelId]/picks'>) {
  if (!routeLimits.play.allow(clientKey(request))) return rateLimited();
  const player = await currentPlayer();
  if (!player) return signedOut();
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const { duelId } = await ctx.params;
  const parsed = duelPicksSchema.safeParse({ ...(json.body as object), duelId });
  if (!parsed.success) return errorResponse(400, 'invalid', firstIssue(parsed.error));

  const result = await submitPicks(prisma, player, parsed.data.duelId, parsed.data.choices);
  switch (result.kind) {
    case 'sent':
      return noContent();
    case 'already_sent':
      return errorResponse(409, 'already_sent', 'You already sent your picks for this one.');
    case 'wrong_length':
      return errorResponse(400, 'wrong_length', 'Pick one side of every pair.');
    case 'not_found':
      return errorResponse(404, 'not_found');
  }
}
