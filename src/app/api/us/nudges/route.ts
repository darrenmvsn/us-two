import { firstIssue, nudgeEndpointSchema, nudgeSubscriptionSchema } from '@/lib/couple/inputs';
import { routeLimits } from '@/lib/http/limits';
import { currentPlayer } from '@/lib/http/player-session';
import { clientKey } from '@/lib/http/rate-limit';
import { errorResponse, noContent, rateLimited, readJson, signedOut } from '@/lib/http/responses';
import { nudgePublicKey } from '@/lib/nudges/nudge-config';
import { turnOffNudges, turnOnNudges } from '@/lib/nudges/subscriptions';
import { prisma } from '@/lib/prisma';

/** Turn nudges on for this phone: the browser's push subscription. */
export async function POST(request: Request) {
  if (!routeLimits.play.allow(clientKey(request))) return rateLimited();
  const ctx = await currentPlayer();
  if (!ctx) return signedOut();
  if (!nudgePublicKey()) return errorResponse(404, 'nudges_off', 'Nudges are not available yet.');
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const parsed = nudgeSubscriptionSchema.safeParse(json.body);
  if (!parsed.success) return errorResponse(400, 'invalid', firstIssue(parsed.error));

  await turnOnNudges(prisma, ctx, parsed.data);
  return noContent();
}

/** Turn nudges off for this phone. */
export async function DELETE(request: Request) {
  if (!routeLimits.play.allow(clientKey(request))) return rateLimited();
  const ctx = await currentPlayer();
  if (!ctx) return signedOut();
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const parsed = nudgeEndpointSchema.safeParse(json.body);
  if (!parsed.success) return errorResponse(400, 'invalid', firstIssue(parsed.error));

  await turnOffNudges(prisma, ctx, parsed.data.endpoint);
  return noContent();
}
