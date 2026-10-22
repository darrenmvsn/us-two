#!/usr/bin/env bash
# Creates Us Two's database and role inside Viralab's shared Postgres 16
# container, or brings them back in line with .env. Safe to re-run: deploy.sh
# runs it on every deploy.
#
#   - role `ustwo`: LOGIN only (no superuser, createdb or createrole),
#     password = USTWO_DB_PASSWORD from .env, re-applied on every run so
#     rotating it is: change .env, run deploy.sh.
#   - database `ustwo`, owned by that role; CONNECT revoked from PUBLIC,
#     so no other app's role can open it.
#   - CONNECT on Viralab's own database revoked from PUBLIC as well, so this
#     role cannot open that one. This is a change to Viralab's database, not
#     only Us Two's: Viralab's role owns it and keeps access, but any
#     other role that relied on PUBLIC's CONNECT there loses it
#     (Viralab's and DesignLoop's kits do the same).
#
# The password reaches psql on stdin, never on a command line (where `ps` on
# the host would show it), and is never printed.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
load_env

: "${USTWO_DB_PASSWORD:?set USTWO_DB_PASSWORD in $here/.env}"
# Restricted to characters that need no quoting anywhere it travels: psql's
# \set, the compose DATABASE_URL and the URL's userinfo. deploy.sh generates
# 48 hex characters.
[[ "$USTWO_DB_PASSWORD" =~ ^[A-Za-z0-9_-]{24,}$ ]] \
  || die "USTWO_DB_PASSWORD must be at least 24 characters of A-Z a-z 0-9 _ - (try: openssl rand -hex 24)."

superuser="${VIRALAB_PG_SUPERUSER:-viralab}"
viralab_db="${VIRALAB_PG_DATABASE:-viralab}"
postgres="$(viralab_container postgres)"

# Local socket inside the container: the official image trusts it, which is
# how Viralab's own backup.sh connects too.
{
  printf '\\set pw %s\n' "$USTWO_DB_PASSWORD"
  printf '\\set viralab_db %s\n' "$viralab_db"
  cat <<'SQL'
\set ON_ERROR_STOP 1
SELECT 'CREATE ROLE ustwo' WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ustwo') \gexec
SELECT format('ALTER ROLE ustwo WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD %L', :'pw') \gexec
SELECT 'CREATE DATABASE ustwo OWNER ustwo' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'ustwo') \gexec
REVOKE ALL ON DATABASE ustwo FROM PUBLIC;
GRANT ALL ON DATABASE ustwo TO ustwo;
SELECT format('REVOKE CONNECT ON DATABASE %I FROM PUBLIC', :'viralab_db') \gexec
\connect ustwo
ALTER SCHEMA public OWNER TO ustwo;
SQL
} | docker exec -i "$postgres" psql -X -q -U "$superuser" -d postgres >/dev/null

echo "ustwo: database and role 'ustwo' are in place."
