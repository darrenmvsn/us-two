import { startCouple } from '@/lib/couple/game';
import { firstIssue, startCoupleSchema } from '@/lib/couple/inputs';
import { routeLimits } from '@/lib/http/limits';
import { setPlayerCookie } from '@/lib/http/player-session';
import { clientKey } from '@/lib/http/rate-limit';
import { errorResponse, privateJson, rateLimited, readJson } from '@/lib/http/responses';
import { prisma } from '@/lib/prisma';

/** Start a game: this phone becomes the first player and gets the invite link. */
export async function POST(request: Request) {
  if (!routeLimits.startCouple.allow(clientKey(request))) return rateLimited();
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const parsed = startCoupleSchema.safeParse(json.body);
  if (!parsed.success) return errorResponse(400, 'invalid', firstIssue(parsed.error));

  const started = await startCouple(prisma, parsed.data);
  await setPlayerCookie(started.token);
  return privateJson({ started: true }, 201);
}
