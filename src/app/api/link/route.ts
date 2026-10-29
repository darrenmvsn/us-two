import { redeemDeviceLink } from '@/lib/couple/devices';
import { deviceLinkCodeSchema, firstIssue } from '@/lib/couple/inputs';
import { routeLimits } from '@/lib/http/limits';
import { currentPlayer, setPlayerCookie } from '@/lib/http/player-session';
import { clientKey } from '@/lib/http/rate-limit';
import { errorResponse, privateJson, rateLimited, readJson } from '@/lib/http/responses';
import { prisma } from '@/lib/prisma';

/** Sign this phone in with a one-time link from Settings. Works without a player, like joining. */
export async function POST(request: Request) {
  if (!routeLimits.linkPhone.allow(clientKey(request))) return rateLimited();
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const parsed = deviceLinkCodeSchema.safeParse(json.body);
  if (!parsed.success) return errorResponse(400, 'invalid', firstIssue(parsed.error));

  const result = await redeemDeviceLink(prisma, parsed.data.code, await currentPlayer());
  switch (result.kind) {
    case 'linked':
      await setPlayerCookie(result.token);
      return privateJson({ linked: true }, 201);
    case 'already_in':
      return errorResponse(409, 'already_in', 'This phone is already in.');
    case 'partner_phone':
      return errorResponse(409, 'partner_phone', 'This link is for the other phone. Send it there instead.');
    case 'expired':
      return errorResponse(404, 'expired', 'This link has been used or is more than 30 minutes old. Make a new one in Settings.');
    case 'not_found':
      return errorResponse(404, 'not_found', 'This link is not right. Make a new one in Settings.');
  }
}
