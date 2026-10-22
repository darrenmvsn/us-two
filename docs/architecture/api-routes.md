# API routes

Every handler under `src/app/api/**/route.ts` follows the same order and
shapes as DesignLoop's and Moatlab's contracts. `src/app/api/us/answers/route.ts`
is the reference.

## Order of work in a handler

1. **Rate limit** per client: `routeLimits.<name>.allow(clientKey(request))`
   (`src/lib/http/limits.ts`); refused is a 429. Caddy overwrites
   `X-Forwarded-For` with the real client, so the key cannot be chosen.
2. **Resolve the player** from the cookie (`currentPlayer()`); none is a 401.
   Only `POST /api/couples` and `POST /api/couples/join` work without one.
3. **Read and validate input**: `readJson` refuses anything but
   `application/json` (415), which is also the CSRF guard, since a cross-site
   form cannot send it without a preflight this app never answers. Then a Zod
   schema from `src/lib/couple/inputs.ts`; failure is a 400 with the first
   issue's message, written to be shown as is.
4. **Call one application function** (`submitAnswer`, `startDuel`, …) with
   `prisma` passed in. It returns a discriminated result, not an HTTP response.
5. **Map the result** with an exhaustive `switch (result.kind)`.

## Responses

- Success: the resource as a plain object with `Cache-Control: private,
  no-store` (`privateJson`), or 204 when there is nothing to return.
- Error: `{ error: '<code>', message?: '<sentence to show>' }`. Never a stack
  trace or a partner's data.

| Status | Meaning |
|---|---|
| 201 | A game, a join or a This or that set was created |
| 204 | Done, nothing to return |
| 400 | Bad input, or an answer that does not fit the question |
| 401 | No player cookie, or the game was ended |
| 404 | No such round, set, pack or invite in this couple |
| 409 | Already answered, already joined, a newer round exists, or the next question is not due |
| 415 | Not JSON |
| 429 | Rate limited |

## Analytics

The application layer reports a fact with one `report*` function from
`src/lib/analytics/product-events.ts` after the write succeeds. Delivery runs
after the response; it never changes the status. No names or answers, ever.

## Tests

A route gets a `route.test.ts` beside it covering validation before any
database call, each result kind and the rate limit. Application functions are
tested against Postgres (`*.db.test.ts`, `TEST_DATABASE_URL`).
