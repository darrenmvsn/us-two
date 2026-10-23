import { choosePack } from '@/lib/couple/game';
import { firstIssue, packChoiceSchema } from '@/lib/couple/inputs';
import { routeLimits } from '@/lib/http/limits';
import { currentPlayer } from '@/lib/http/player-session';
import { clientKey } from '@/lib/http/rate-limit';
import { errorResponse, noContent, rateLimited, readJson, signedOut } from '@/lib/http/responses';
import { prisma } from '@/lib/prisma';

/** Choose the pack the next questions come from. */
export async function PUT(request: Request) {
  if (!routeLimits.play.allow(clientKey(request))) return rateLimited();
  const ctx = await currentPlayer();
  if (!ctx) return signedOut();
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const parsed = packChoiceSchema.safeParse(json.body);
  if (!parsed.success) return errorResponse(400, 'invalid', firstIssue(parsed.error));

  const result = await choosePack(prisma, ctx, parsed.data.packId);
  switch (result.kind) {
    case 'chosen':
      return noContent();
    case 'unknown_pack':
      return errorResponse(404, 'unknown_pack');
  }
}
