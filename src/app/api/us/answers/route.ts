import { submitAnswer } from '@/lib/couple/game';
import { answerSchema, firstIssue } from '@/lib/couple/inputs';
import { routeLimits } from '@/lib/http/limits';
import { currentPlayer } from '@/lib/http/player-session';
import { clientKey } from '@/lib/http/rate-limit';
import { errorResponse, noContent, rateLimited, readJson, signedOut } from '@/lib/http/responses';
import { prisma } from '@/lib/prisma';

/** Answer the current round. Answers are final. */
export async function POST(request: Request) {
  if (!routeLimits.play.allow(clientKey(request))) return rateLimited();
  const ctx = await currentPlayer();
  if (!ctx) return signedOut();
  const json = await readJson(request);
  if (!json.ok) return json.response;
  const parsed = answerSchema.safeParse(json.body);
  if (!parsed.success) return errorResponse(400, 'invalid', firstIssue(parsed.error));

  const result = await submitAnswer(prisma, ctx, parsed.data);
  switch (result.kind) {
    case 'answered':
      return noContent();
    case 'already_answered':
      return errorResponse(409, 'already_answered', 'You already answered this one.');
    case 'not_current':
      return errorResponse(409, 'not_current', 'There is a newer question. Reload to see it.');
    case 'not_found':
      return errorResponse(404, 'not_found');
    case 'wrong_kind':
    case 'bad_option':
      return errorResponse(400, result.kind, 'That answer does not fit this question.');
  }
}
