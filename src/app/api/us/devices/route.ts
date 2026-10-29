import { createDeviceLink, signOutOtherPhones } from '@/lib/couple/devices';
import { deviceLinkForSchema, firstIssue } from '@/lib/couple/inputs';
import { routeLimits } from '@/lib/http/limits';
import { currentPlayer } from '@/lib/http/player-session';
import { clientKey } from '@/lib/http/rate-limit';
import { errorResponse, noContent, privateJson, rateLimited, readJson, signedOut } from '@/lib/http/responses';
import { prisma } from '@/lib/prisma';

/** A one-time link that signs another phone in: for you, or for your partner to get back in. */
export async function POST(request: Request) {
  if (!routeLimits.play.allow(clientKey(request))) return rateLimited();
  const ctx = await currentPlayer();
  if (!ctx) return signedOut();
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const parsed = deviceLinkForSchema.safeParse(json.body);
  if (!parsed.success) return errorResponse(400, 'invalid', firstIssue(parsed.error));

  const result = await createDeviceLink(prisma, ctx, parsed.data.for);
  switch (result.kind) {
    case 'created':
      return privateJson({ path: `/link/${result.code}`, expiresAt: result.expiresAt.toISOString() }, 201);
    case 'no_partner':
      return errorResponse(409, 'no_partner', 'Your partner has not joined yet.');
  }
}

/** Sign out every other phone playing as you. */
export async function DELETE(request: Request) {
  if (!routeLimits.play.allow(clientKey(request))) return rateLimited();
  const ctx = await currentPlayer();
  if (!ctx) return signedOut();
  await signOutOtherPhones(prisma, ctx);
  return noContent();
}
