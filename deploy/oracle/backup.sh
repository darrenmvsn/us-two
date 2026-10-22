#!/usr/bin/env bash
# Nightly dump of Us Two's database to ./backups, keeping 14 days.
# deploy.sh installs it in cron at 03:45 UTC (Viralab's own dump runs 03:15).
#
# Postgres is reachable only inside the compose network, so this runs the
# container's own pg_dump. Restore with pg_restore (this folder's README).
#
# Off-box copy: if rclone has a remote named `offsite` (the one Viralab's
# backup.sh uses, e.g. a Cloudflare R2 bucket), each dump is copied to
# offsite:ustwo-backups/.
set -euo pipefail
# The dumps hold names and answers: owner-only files.
umask 077
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
# Cron starts with an almost empty environment, so .env is the only place
# BACKUP_RETENTION_DAYS and the VIRALAB_* overrides can come from.
load_env

retention_days="${BACKUP_RETENTION_DAYS:-14}"
superuser="${VIRALAB_PG_SUPERUSER:-viralab}"
postgres="$(viralab_container postgres)"

mkdir -p "$here/backups"
out="$here/backups/ustwo-$(date -u +%Y%m%dT%H%M%SZ).dump"

docker exec "$postgres" pg_dump -U "$superuser" -d ustwo \
  --format=custom --no-owner --no-privileges > "$out.part"
[[ -s "$out.part" ]] || die "pg_dump wrote nothing; keeping the previous dumps."
# Read the archive back with the same major version that wrote it.
docker exec -i "$postgres" pg_restore --list < "$out.part" > /dev/null \
  || die "the new dump does not read back; left at $out.part for inspection."
mv "$out.part" "$out"

find "$here/backups" -maxdepth 1 -name 'ustwo-*.dump' -type f -mtime "+$retention_days" -delete

if command -v rclone >/dev/null && rclone listremotes | grep -qx 'offsite:'; then
  rclone copy "$out" offsite:ustwo-backups/
  # A failed prune leaves dumps offsite past the retention the privacy policy
  # states, so say so loudly (cron mails stderr) instead of hiding it.
  if ! rclone delete --min-age "${retention_days}d" offsite:ustwo-backups/; then
    echo "$(date -u +%FT%TZ) ERROR: offsite prune failed; dumps older than ${retention_days} days may remain in offsite:ustwo-backups/" >&2
  fi
fi
echo "$(date -u +%FT%TZ) wrote $out ($(du -h "$out" | cut -f1))"
