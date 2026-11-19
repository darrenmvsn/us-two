# Us Two on Vercel (Hobby) with Neon

A $0 way to put Us Two online now, the same shape as Tickr's
(`darrenmvsn/stocks-analysis`, `deploy/vercel/`). The Oracle kit
(`deploy/oracle/`) stays the long-term plan: nothing here is Vercel-only, so
moving is setting the same variables there.

## Why only until Us Two charges

Vercel's Hobby plan is for **non-commercial, personal use only**
(https://vercel.com/docs/plans/hobby). The day Us Two takes money or runs ads,
it moves to the Oracle VM (or Vercel Pro). Neon's free plan has no such rule.

## What fits and what changes

| | On Vercel Hobby |
|---|---|
| Framework | Next.js 16 builds as is. `next.config.ts` drops `output: "standalone"` when `VERCEL` is set; the share cards' fonts (`assets/fonts`) are still traced into their functions |
| Background work | None scheduled: nudges and analytics are sent with Next's `after()`, which Vercel waits for. No cron |
| Limits held in memory | Route rate limits (`src/lib/http/limits.ts`) count per instance, so with several warm instances they allow a few times their number. Nothing they guard costs money |
| Free allowance | 1M function calls, 4 active CPU hours, 360 GB-hours of memory and 100 GB transfer a month. Past it, Hobby pauses the project; it never bills |
| Database | Neon free: 0.5 GB, sleeps after 5 minutes idle (the first request after that waits about a second) |
| Migrations | `npm run vercel-build` (`scripts/vercel-build.sh`) runs `prisma migrate deploy` and then `next build`, so a failed migration fails the deploy and the old one keeps serving. It takes `DATABASE_URL_UNPOOLED` when set |

## Steps (Darren)

1. **Neon database.** In the Neon console (same account as Viralab's):
   **New project**, name `us-two`, region **AWS US East (N. Virginia)**,
   beside Vercel's default function region `iad1`. From **Connect**, copy the
   pooled string (host contains `-pooler`) and the direct one (pooling off).
2. **Vercel project.** At https://vercel.com/new, import `darrenmvsn/us-two`.
   Leave framework, root directory and build settings as detected
   (`vercel-build` is picked up from `package.json`).
3. **Environment variables** (Settings > Environment Variables), all
   **Production only**, so a preview never migrates the live database:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon's **pooled** string, with `&connection_limit=5&connect_timeout=15` appended |
   | `DATABASE_URL_UNPOOLED` | Neon's **direct** string |
   | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | optional nudges: run `npx web-push generate-vapid-keys` once and paste the pair. Never change it later (every phone would have to turn nudges on again) |
   | `VAPID_SUBJECT` | `mailto:<your contact address>` |
   | `POSTHOG_PROJECT_TOKEN`, `POSTHOG_HOST` | as Viralab's (optional) |

4. **Deploy.** Deployments > Redeploy (variables apply only to new builds).
   The build log shows Prisma applying each migration.
5. **Check.** `/api/health` answers `{"status":"ok"}`. Start a game on one
   phone, join from another with the invite link, answer on both.

Neon's Vercel integration (Marketplace) can create the database and set
`DATABASE_URL` and `DATABASE_URL_UNPOOLED` instead of step 1, but it sets them
for Preview too; move them to Production only afterwards.

## Leaving Vercel

Set the same variables in `deploy/oracle/.env`, `pg_dump` from Neon and
`pg_restore` into the VM's `ustwo` database, run `deploy/oracle/deploy.sh`,
point DNS at the VM, then delete the Vercel project.
