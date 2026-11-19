#!/usr/bin/env sh
# Vercel's build (`npm run vercel-build`): apply migrations, then build.
# A failed migration fails the deploy, so the previous one keeps serving.
# Migrations take Neon's direct string when set: the pooler cannot hold the
# advisory lock `prisma migrate deploy` takes. A build with no database
# (a preview without the Production-only variables) skips them.
set -eu
if [ -n "${DATABASE_URL_UNPOOLED:-}" ]; then
  DATABASE_URL="$DATABASE_URL_UNPOOLED" npx prisma migrate deploy
elif [ -n "${DATABASE_URL:-}" ]; then
  npx prisma migrate deploy
else
  echo "vercel-build: no DATABASE_URL, migrations skipped"
fi
exec npx next build
