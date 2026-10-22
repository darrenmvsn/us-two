#!/usr/bin/env bash
# Deploys the checked-out commit of Us Two on the shared Oracle VM:
#   git pull && bash deploy/oracle/deploy.sh
#
# First run: writes .env from env.example with generated secrets and stops so
# you can fill it in. Every run after that, in order:
#   1. creates or updates Us Two's database and role (create-db.sh)
#   2. builds the app and tools images on this VM (arm64 here)
#   3. applies migrations (`prisma migrate deploy`); a failure stops here with
#      the old container still serving
#   4. replaces the app container and waits for /api/health; if the new one
#      never turns healthy, the previous image is put back and this exits 1
#   5. installs the nightly backup in cron, and the Caddy site block when
#      USTWO_DOMAIN is set
# Needs Viralab's stack (Postgres, Caddy, its network) already running.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
cd "$here"

if [[ ! -f .env ]]; then
  cp env.example .env
  chmod 600 .env
  sed -i "s|^USTWO_DB_PASSWORD=$|USTWO_DB_PASSWORD=$(openssl rand -hex 24)|" .env
  echo "Created $here/.env with a generated database password."
  echo "Set USTWO_DOMAIN (and PostHog if wanted), then run this again."
  exit 0
fi
load_env

network="${VIRALAB_NETWORK:-viralab_default}"
docker network inspect "$network" >/dev/null 2>&1 \
  || die "Docker network '$network' does not exist. Start Viralab's stack first."

USTWO_BUILD_SHA="$(git -C "$here" rev-parse HEAD)"

echo "==> Database and role"
bash "$here/create-db.sh"

echo "==> Build $USTWO_BUILD_SHA"
# `previous` is the image the running container was started from, not
# whatever `latest` points at: a deploy that failed at migrate leaves a
# never-run build tagged `latest`, and rolling back to that would be no
# rollback at all.
running="$(docker compose ps -q ustwo)"
if [[ -n "$running" ]]; then
  docker tag "$(docker inspect -f '{{.Image}}' "$running")" ustwo-app:previous
fi
docker compose build ustwo ustwo-migrate

echo "==> Migrate"
docker compose run --rm ustwo-migrate


# Prints the app container's health once it settles: `healthy`, or
# `unhealthy` (final: Docker already counted the configured retries), or
# whatever it still was after 200 s.
wait_for_health() {
  local container status="starting"
  container="$(docker compose ps -q ustwo)"
  for _ in $(seq 1 40); do
    status="$(docker inspect -f '{{.State.Health.Status}}' "$container")"
    [[ "$status" == "healthy" || "$status" == "unhealthy" ]] && break
    sleep 5
  done
  echo "$status"
}

echo "==> Restart"
docker compose up -d --no-deps ustwo
status="$(wait_for_health)"
if [[ "$status" != "healthy" ]]; then
  docker compose logs --tail 50 ustwo >&2
  if ! docker image inspect ustwo-app:previous >/dev/null 2>&1; then
    die "the new container stayed '$status' and there is no previous image to put back."
  fi
  docker tag ustwo-app:previous ustwo-app:latest
  docker compose up -d --no-deps ustwo
  rollback_status="$(wait_for_health)"
  die "the new container stayed '$status'; put the previous image back, which is now '$rollback_status' (migrations stay applied)."
fi

echo "==> Nightly backup (03:45 UTC)"
mkdir -p "$here/backups"
cron_line="45 3 * * * $here/backup.sh >> $here/backups/backup.log 2>&1"
( crontab -l 2>/dev/null | grep -vF "$here/backup.sh" || true ; echo "$cron_line" ) | crontab -

if [[ -n "${USTWO_DOMAIN:-}" ]]; then
  echo "==> Caddy"
  bash "$here/caddy-site.sh"
else
  echo "==> Caddy skipped: USTWO_DOMAIN is not set, so the app is reachable only on the VM."
fi

docker image prune -f >/dev/null
echo "Deployed $USTWO_BUILD_SHA. Status: docker compose ps; logs: docker compose logs -f ustwo"
