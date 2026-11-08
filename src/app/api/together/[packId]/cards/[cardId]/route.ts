import { routeLimits } from '@/lib/http/limits';
import { clientKey } from '@/lib/http/rate-limit';
import { errorResponse, rateLimited } from '@/lib/http/responses';
import { renderTogetherCard } from '@/lib/share-card/question-card';
import { cardFormat, togetherCardContent } from '@/lib/together/card-content';

/**
 * A pack's cover (`cover`) or one of its questions (its id) as a slideshow
 * image: `?format=story` (1080 x 1920, the default) or `post` (1080 x 1350).
 * Public: it carries no names and no answers.
 */
export async function GET(request: Request, ctx: RouteContext<'/api/together/[packId]/cards/[cardId]'>) {
  if (!routeLimits.shareCard.allow(clientKey(request))) return rateLimited();
  const format = cardFormat(new URL(request.url).searchParams.get('format'));
  if (!format) return errorResponse(400, 'invalid', 'format must be story or post');
  const { packId, cardId } = await ctx.params;
  const card = togetherCardContent(packId, cardId);
  return card ? renderTogetherCard(card, format) : errorResponse(404, 'not_found');
}
