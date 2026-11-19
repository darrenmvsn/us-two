/** The API's response shapes: the resource on success, `{ error, message? }` otherwise (docs/architecture/api-routes.md). */
export function errorResponse(status: number, error: string, message?: string): Response {
  return Response.json(message ? { error, message } : { error }, { status });
}

export function rateLimited(): Response {
  return errorResponse(429, 'rate_limited', 'Too many tries. Wait a minute and try again.');
}

export function signedOut(): Response {
  return errorResponse(401, 'no_player', 'This phone is not in a game yet.');
}

/** Personal data: never cached by the browser or Cloudflare. */
export function privateJson(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

/** Every body this app accepts is small: the largest, an open answer or a push subscription, is under 2 KB. */
export const MAX_JSON_BYTES = 16 * 1024;

/**
 * A request made by another site, by the browser's own word. Lax cookies
 * still reach a same-site sibling's form post, and an old browser sends no
 * `Sec-Fetch-Site`, so this backs up the JSON-only rule rather than replacing
 * it; routes that change something without a body rely on it alone.
 */
export function isCrossSite(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site');
  return site !== null && site !== 'same-origin' && site !== 'none';
}

export function crossSiteRefused(): Response {
  return errorResponse(403, 'cross_site');
}

/**
 * The JSON body, or a response refusing it. Requiring `application/json`
 * means a cross-site form cannot post here: a browser preflights that
 * content type, and this app answers no CORS preflight. The body is read up
 * to `MAX_JSON_BYTES` (by `Content-Length`, or by counting a chunked stream):
 * route handlers have no body limit of their own, and `request.json()` would
 * buffer whatever arrives.
 */
export async function readJson(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  if (isCrossSite(request)) return { ok: false, response: crossSiteRefused() };
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return { ok: false, response: errorResponse(415, 'json_only') };
  }
  const badJson = { ok: false as const, response: errorResponse(400, 'bad_json', 'Something went wrong sending that. Try again.') };
  const tooLarge = { ok: false as const, response: errorResponse(413, 'too_large', 'That is too long to send.') };
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_JSON_BYTES) return tooLarge;
  if (!request.body) return badJson;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_JSON_BYTES) {
        await reader.cancel().catch(() => undefined);
        return tooLarge;
      }
      chunks.push(value);
    }
    return { ok: true, body: JSON.parse(new TextDecoder().decode(Buffer.concat(chunks))) };
  } catch {
    return badJson;
  }
}
