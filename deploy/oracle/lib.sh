# Shared by Us Two's Oracle scripts; sourced, never run. Reads .env from
# this folder and finds Viralab's containers by their compose labels, so no
# script needs Viralab's checkout path except caddy-site.sh.

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VIRALAB_PROJECT="${VIRALAB_PROJECT:-viralab}"

die() {
  echo "ustwo: $*" >&2
  exit 1
}

# Reads .env without `source`, so a value is never executed as shell.
load_env() {
  [[ -f "$here/.env" ]] || die "no $here/.env yet: run deploy.sh once to create it."
  local line key value
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
    key="${line%%=*}"
    value="${line#*=}"
    [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    # Strip one pair of surrounding quotes, as docker compose does.
    if [[ "$value" =~ ^\"(.*)\"$ || "$value" =~ ^\'(.*)\'$ ]]; then
      value="${BASH_REMATCH[1]}"
    fi
    # The shell's own environment wins, as it does for docker compose.
    if [[ -z "${!key+x}" ]]; then
      export "$key=$value"
    fi
  done < "$here/.env"
}

# Prints what Viralab's Caddyfile ($1) still lacks before Us Two's site
# block may be installed, one item per line; prints nothing when it is ready.
# Trusting CF-Connecting-IP is required, not optional: without it {client_ip}
# is the Cloudflare edge, and every visitor behind one edge would share one
# rate-limit bucket. client_ip_headers alone
# does nothing (Caddy reads it only from a trusted proxy), so both lines are
# required.
caddyfile_missing_prerequisites() {
  local caddyfile="$1"
  grep -Eq '^[[:space:]]*import[[:space:]]+sites/\*\.caddy([[:space:]]|$)' "$caddyfile" \
    || echo "import sites/*.caddy"
  grep -Eq '^[[:space:]]*trusted_proxies[[:space:]]+[^[:space:]]' "$caddyfile" \
    || echo "trusted_proxies (Cloudflare's ranges)"
  grep -Eq '^[[:space:]]*client_ip_headers[[:space:]]+CF-Connecting-IP([[:space:]]|$)' "$caddyfile" \
    || echo "client_ip_headers CF-Connecting-IP"
  return 0
}

# The id of one of Viralab's running compose containers, e.g. `postgres`.
viralab_container() {
  local service="$1" id
  id="$(docker ps -q \
    --filter "label=com.docker.compose.project=$VIRALAB_PROJECT" \
    --filter "label=com.docker.compose.service=$service")"
  [[ -n "$id" ]] || die "Viralab's '$service' container is not running (compose project '$VIRALAB_PROJECT'). Start Viralab first: its deploy/oracle/setup.sh."
  [[ "$(wc -l <<< "$id")" -eq 1 ]] || die "more than one Viralab '$service' container is running."
  echo "$id"
}
