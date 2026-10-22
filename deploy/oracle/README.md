# Us Two on the shared Oracle VM

Us Two runs beside Viralab (and DesignLoop, Moatlab) on one Oracle Cloud
Always Free ARM VM: its own container (0.5 CPU, 512 MB), its own database and
role in Viralab's Postgres 16, a site block in Viralab's Caddy, Cloudflare in
front. Ported from DesignLoop's kit (`darrenmvsn/sysdes-mock`, `deploy/oracle/`).

| File | What it is |
|---|---|
| `Dockerfile` | Multi-stage image, build context the repo root. `runner`: the Next.js standalone server, non-root, healthchecked. `tools`: Prisma CLI for migrations |
| `docker-compose.yml` | `ustwo` and `ustwo-migrate` on Viralab's `viralab_default` network |
| `Caddyfile.ustwo` | The site block; `caddy-site.sh` installs it into Viralab's Caddy |
| `deploy.sh` | Database, build, migrate, restart, health gate with automatic rollback, backup cron, Caddy |
| `create-db.sh` | Idempotent database and role in the shared Postgres |
| `caddy-site.sh` | Renders, validates and reloads the Caddy site block |
| `backup.sh` | Nightly custom-format `pg_dump`, 14 days, optional rclone `offsite` copy |
| `env.example` | Every variable; `deploy.sh` makes `.env` from it |
| `lib.sh` | Helpers the scripts source |

```bash
# first time (Viralab's stack already running): writes .env and stops
bash deploy/oracle/deploy.sh
# every deploy after that
git pull && bash deploy/oracle/deploy.sh
```

## The one-time change on Viralab's side

The same change DesignLoop needs, made once per VM (viralab PR #250): Viralab's
Caddyfile has `import sites/*.caddy`, a global `trusted_proxies` block with
Cloudflare's ranges and `client_ip_headers CF-Connecting-IP`, and `./sites`
mounted at `/etc/caddy/sites`. `caddy-site.sh` checks all three and refuses
otherwise.

## Restore

```bash
docker exec -i "$(docker ps -q --filter label=com.docker.compose.service=postgres)" \
  pg_restore -U viralab -d ustwo --clean --if-exists --no-owner < backups/ustwo-<stamp>.dump
```

## Cost and memory

No model, speech or paid API calls: the cost per active user is the VM's
share, $0 on the free tier. Memory is not measured yet; the app holds no
caches beyond the per-client rate-limit windows (capped at 10,000 keys per
limiter). Measure `docker stats ustwo` after the first day.
