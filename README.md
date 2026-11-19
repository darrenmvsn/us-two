# Us Two

One question a day for couples. Each of you answers on your own phone, guesses
what the other picked, and sees both answers once you have both answered. Plus
**This or that, couple edition**: ten quick picks on a theme, then how many
you matched. No app to download and no account: one partner starts, sends a
link, the other joins.

Part of the Viralab project (`AGENTS.md`). Next.js 16, React 19, Prisma on
Postgres 16, Tailwind 4. Runs at $0: no model or paid API calls.

## Run it

```bash
npm install                      # .npmrc sets legacy-peer-deps
echo 'DATABASE_URL="postgresql://ustwo:ustwo@localhost:5432/ustwo"' > .env
npx prisma migrate deploy
npm run dev                      # http://localhost:3000
```

Play both sides with two browsers (or a normal and a private window).

## Check it

```bash
npm run typecheck && npm run lint
npm test                                             # unit and route tests
TEST_DATABASE_URL=postgresql://ustwo:ustwo@localhost:5432/ustwo npm test   # plus Postgres tests
npm run build
```

## Where things are

| Path | What |
|---|---|
| `src/lib/questions/` | The question bank, packs and the "Me / partner" perspective |
| `src/lib/this-or-that/` | This or that sets, scoring and the game between two phones |
| `src/lib/couple/` | Starting, joining, rounds, the schedule, streaks, what each player may see, and extra phones (`devices.ts`) |
| `src/lib/nudges/` | Web push nudges ("Sam answered, your turn"), off until `VAPID_*` is set; the service worker is `public/sw.js` |
| `src/lib/share-card/` | Story-sized share cards drawn with `next/og`; fonts in `assets/fonts` |
| `src/app/api/` | Thin route handlers (`docs/architecture/api-routes.md`) |
| `src/app/us/` | The in-game screens |
| `deploy/oracle/` | The kit for the shared Oracle VM |

## Database connections

`src/lib/prisma.ts` keeps one Prisma client per process, and so one pool.
Its size is the `connection_limit` on `DATABASE_URL`:

- **Oracle VM** (one long-lived container): `connection_limit=5`, set in
  `deploy/oracle/docker-compose.yml`. The VM's Postgres is shared with the
  other apps, so keep it small.
- **Serverless (Vercel or similar)**: every warm function instance holds its
  own pool, so use `connection_limit=1` and point `DATABASE_URL` at a pooler
  (PgBouncer, Neon's or Supabase's pooled host) with `pgbouncer=true`; give
  `prisma migrate deploy` the direct, unpooled URL (`directUrl` in
  `prisma/schema.prisma` if you split them).

When the database is unreachable, pages show the error page and every API
route answers `503 { error: "unavailable" }` (`src/lib/server/unexpected-error.ts`);
Together mode keeps working, since it reads nothing from the database.
