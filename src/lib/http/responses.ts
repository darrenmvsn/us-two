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

/**
 * The JSON body, or a response refusing it. Requiring `application/json`
 * means a cross-site form cannot post here: a browser preflights that
 * content type, and this app answers no CORS preflight.
 */
export async function readJson(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return { ok: false, response: errorResponse(415, 'json_only') };
  }
  try {
    return { ok: true, body: await request.json() };
  } catch {
    return { ok: false, response: errorResponse(400, 'bad_json', 'Something went wrong sending that. Try again.') };
  }
}
