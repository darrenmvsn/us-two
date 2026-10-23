#!/usr/bin/env bash
# Installs Us Two's Caddy site block (Caddyfile.ustwo, with
# USTWO_DOMAIN filled in) into the sites folder Viralab's Caddy imports,
# validates the whole config and reloads Caddy. Safe to re-run; deploy.sh runs
# it whenever USTWO_DOMAIN is set. A config that fails validation is
# rolled back before Caddy ever loads it, so Viralab keeps serving.
#
# Needs the one-time change on Viralab's side described in this folder's README
# ("The one-time change on Viralab's side"): `import sites/*.caddy` in its Caddyfile, the global trusted_proxies
# block for Cloudflare, and ./sites mounted at /etc/caddy/sites.
# VIRALAB_ORACLE_DIR is Viralab's kit folder on the VM.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
load_env

domain="${USTWO_DOMAIN:-}"
[[ -n "$domain" ]] || die "USTWO_DOMAIN is not set in $here/.env; nothing to install."
[[ "$domain" =~ ^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$ ]] || die "USTWO_DOMAIN '$domain' is not a hostname."

viralab_dir="${VIRALAB_ORACLE_DIR:-$HOME/viralab/MiroFish/deploy/oracle}"
[[ -f "$viralab_dir/Caddyfile" ]] || die "no Caddyfile in $viralab_dir; set VIRALAB_ORACLE_DIR to Viralab's deploy/oracle folder."
missing="$(caddyfile_missing_prerequisites "$viralab_dir/Caddyfile")"
[[ -z "$missing" ]] || die "Viralab's Caddyfile is missing: ${missing//$'\n'/; }. Make the one-time change in this folder's README  first."

caddy="$(viralab_container caddy)"
docker exec "$caddy" test -d /etc/caddy/sites \
  || die "Viralab's Caddy has no /etc/caddy/sites mount; make the one-time change in this folder's README  first."

sites="$viralab_dir/sites"
target="$sites/ustwo.caddy"
mkdir -p "$sites"
backup=""
rendered=""
# Whatever is left of either temp file on any exit, an interrupted run included.
trap 'rm -f "$rendered" "$backup"' EXIT
if [[ -f "$target" ]]; then
  backup="$(mktemp)"
  cp -p "$target" "$backup"
fi
# Rendered under a name Caddy does not import (it loads only *.caddy) and
# moved into place whole, so Caddy never reads a half-written block.
rendered="$(mktemp "$sites/.ustwo.XXXXXX")"
sed "s|{\$USTWO_DOMAIN}|$domain|" "$here/Caddyfile.ustwo" > "$rendered"
chmod 644 "$rendered"
mv "$rendered" "$target"
rendered=""

# Caddy logs routine lines (and a harmless "unnecessary header_up" warning for
# the X-Forwarded-Host/Proto overrides, which matter once Cloudflare is a
# trusted proxy) to stderr; show them only when something fails.
if ! validation="$(docker exec "$caddy" caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1)"; then
  echo "$validation" >&2
  if [[ -n "$backup" ]]; then mv "$backup" "$target" && backup=""; else rm -f "$target"; fi
  die "Caddy rejected the config; restored the previous site block. Caddy was not reloaded."
fi
if ! reload="$(docker exec "$caddy" caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1)"; then
  echo "$reload" >&2
  die "Caddy validated the config but the reload failed; Caddy keeps serving its previous config."
fi
echo "ustwo: Caddy now serves https://$domain"
