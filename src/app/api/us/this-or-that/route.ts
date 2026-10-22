import { firstIssue, startDuelSchema } from '@/lib/couple/inputs';
import { routeLimits } from '@/lib/http/limits';
import { currentPlayer } from '@/lib/http/player-session';
import { clientKey } from '@/lib/http/rate-limit';
import { errorResponse, privateJson, rateLimited, readJson, signedOut } from '@/lib/http/responses';
import { prisma } from '@/lib/prisma';
import { loadThisOrThat, startDuel } from '@/lib/this-or-that/duels';

export async function GET(request: Request) {
  if (!routeLimits.read.allow(clientKey(request))) return rateLimited();
  const ctx = await currentPlayer();
  if (!ctx) return signedOut();
  return privateJson(await loadThisOrThat(prisma, ctx));
}

/** Start a This or that set, or get the one already open. */
export async function POST(request: Request) {
  if (!routeLimits.play.allow(clientKey(request))) return rateLimited();
  const ctx = await currentPlayer();
  if (!ctx) return signedOut();
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const parsed = startDuelSchema.safeParse(json.body);
  if (!parsed.success) return errorResponse(400, 'invalid', firstIssue(parsed.error));

  const result = await startDuel(prisma, ctx, parsed.data.setId);
  switch (result.kind) {
    case 'started':
      return privateJson({ duelId: result.duelId }, 201);
    case 'one_open':
      return privateJson({ duelId: result.duelId, alreadyOpen: true });
    case 'unknown_set':
      return errorResponse(404, 'unknown_set');
  }
}
