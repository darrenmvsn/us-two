import { joinCouple } from '@/lib/couple/game';
import { firstIssue, joinCoupleSchema } from '@/lib/couple/inputs';
import { routeLimits } from '@/lib/http/limits';
import { currentPlayer, setPlayerCookie } from '@/lib/http/player-session';
import { clientKey } from '@/lib/http/rate-limit';
import { errorResponse, privateJson, rateLimited, readJson } from '@/lib/http/responses';
import { prisma } from '@/lib/prisma';

/** Join the game an invite link names, as the second player. */
export async function POST(request: Request) {
  if (!routeLimits.joinCouple.allow(clientKey(request))) return rateLimited();
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const parsed = joinCoupleSchema.safeParse(json.body);
  if (!parsed.success) return errorResponse(400, 'invalid', firstIssue(parsed.error));

  const result = await joinCouple(prisma, parsed.data, await currentPlayer());
  switch (result.kind) {
    case 'joined':
      await setPlayerCookie(result.token);
      return privateJson({ joined: true }, 201);
    case 'own_invite':
      return errorResponse(409, 'own_invite', 'This is your own link. Send it to your partner instead.');
    case 'taken':
      return errorResponse(409, 'taken', 'Someone has already joined with this link. Ask for a new one.');
    case 'not_found':
      return errorResponse(404, 'not_found', 'This link has expired or the game was ended.');
  }
}
