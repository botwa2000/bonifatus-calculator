# Deployment Guide

Bonifatus is deployed to a **Hetzner VPS** using **Docker Swarm**. Two environments run on the same server.

|            | Dev                          | Prod                                |
| ---------- | ---------------------------- | ----------------------------------- |
| Domain     | dev.bonifatus.com            | bonifatus.com                       |
| Branch     | `dev`                        | `main`                              |
| Port       | 3001                         | 3000                                |
| Stack      | `bonifatus-dev`              | `bonifatus-prod`                    |
| Image      | `bonifatus:dev`              | `bonifatus:prod`                    |
| Stack file | `docker-stack.dev.yml`       | `docker-stack.prod.yml`             |
| Repo dir   | `/home/deploy/bonifatus-dev` | `/home/deploy/bonifatus-calculator` |

## SSH

All commands use the Windows OpenSSH client:

```bash
/c/Windows/System32/OpenSSH/ssh.exe root@159.69.180.183 "echo connected"
```

> **Important:** On Windows (Git Bash / Claude Code), always use `/c/Windows/System32/OpenSSH/ssh.exe` as the SSH binary. The `deploy.sh` heredoc syntax does not work reliably on Windows — use the manual step-by-step commands below instead.

Shorthand used in examples below:

```bash
SSH="ssh root@159.69.180.183"
# or on Windows:
SSH="/c/Windows/System32/OpenSSH/ssh.exe root@159.69.180.183"
```

## Deploy to Dev

Run these commands sequentially from the local machine:

```bash
# 1. Push code
git push origin dev

# 2. Pull on server
$SSH "cd /home/deploy/bonifatus-dev && git fetch origin && git checkout dev && git pull origin dev"

# 3. Build Docker image (~3 min cached, ~5 min fresh)
$SSH "cd /home/deploy/bonifatus-dev && docker build \
  --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACWJz491rhjNxKNi \
  --build-arg NEXT_PUBLIC_APP_URL=https://dev.bonifatus.com \
  --build-arg NEXT_PUBLIC_DEBUG_LEVEL=verbose \
  -t bonifatus:dev ."

# 4. Deploy stack and force update
$SSH "cd /home/deploy/bonifatus-dev && docker stack deploy -c docker-stack.dev.yml bonifatus-dev && docker service update --force --image bonifatus:dev bonifatus-dev_app"

# 5. Health check (wait for service to converge, then)
$SSH "curl -sf http://localhost:3001/api/health"
# Expected: {"status":"ok"}
```

## Deploy to Prod

```bash
# 1. Merge and push
git checkout main && git merge dev && git push origin main

# 2. Pull on server
$SSH "cd /home/deploy/bonifatus-calculator && git fetch origin && git checkout main && git pull origin main"

# 3. Build Docker image
$SSH "cd /home/deploy/bonifatus-calculator && docker build \
  --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAB7cH7pweCPsYnpL \
  --build-arg NEXT_PUBLIC_APP_URL=https://bonifatus.com \
  --build-arg NEXT_PUBLIC_DEBUG_LEVEL=none \
  -t bonifatus:prod ."

# 4. Deploy stack and force update
$SSH "cd /home/deploy/bonifatus-calculator && docker stack deploy -c docker-stack.prod.yml bonifatus-prod && docker service update --force --image bonifatus:prod bonifatus-prod_app"

# 5. Health check
$SSH "curl -sf http://localhost:3000/api/health"
# Expected: {"status":"ok"}

# 6. Switch back to dev locally
git checkout dev
```

## Database

### Connection details

| Env  | Host (from server) | Database       | User      | Password          |
| ---- | ------------------ | -------------- | --------- | ----------------- |
| Dev  | localhost          | bonifatus_dev  | bonifatus | Bon1fatusPr0d2026 |
| Prod | localhost          | bonifatus_prod | bonifatus | Bon1fatusPr0d2026 |

> **Important:** Use `localhost` for the psql host, not the Docker bridge IP (`172.18.0.1`). The bridge IP is rejected by pg_hba.conf from the host; `localhost` works.

### Run SQL / psql

```bash
# Dev — interactive psql
$SSH "PGPASSWORD=Bon1fatusPr0d2026 psql -h localhost -U bonifatus -d bonifatus_dev"

# Prod — interactive psql
$SSH "PGPASSWORD=Bon1fatusPr0d2026 psql -h localhost -U bonifatus -d bonifatus_prod"

# Run a single query
$SSH "PGPASSWORD=Bon1fatusPr0d2026 psql -h localhost -U bonifatus -d bonifatus_dev -c 'SELECT count(*) FROM subjects'"
```

### Run migrations

Migration files live in `drizzle/migrations/`. Apply them with `psql -f` after deployment (the deploy step pulls the files to the server).

> **Do NOT use `npx drizzle-kit migrate`** — it requires `DATABASE_URL` from `/run/secrets/` which is only accessible inside Docker containers, and the standalone container does not have drizzle-kit installed.

```bash
# Dev — apply a specific migration
$SSH "PGPASSWORD=Bon1fatusPr0d2026 psql -h localhost -U bonifatus -d bonifatus_dev \
  -f /home/deploy/bonifatus-dev/drizzle/migrations/0006_fix-bonus-formula-and-term-types.sql"

# Prod — apply a specific migration
$SSH "PGPASSWORD=Bon1fatusPr0d2026 psql -h localhost -U bonifatus -d bonifatus_prod \
  -f /home/deploy/bonifatus-calculator/drizzle/migrations/0006_fix-bonus-formula-and-term-types.sql"

# Apply all migrations in order (example)
for f in 0003 0004 0005 0006; do
  $SSH "PGPASSWORD=Bon1fatusPr0d2026 psql -h localhost -U bonifatus -d bonifatus_dev \
    -f /home/deploy/bonifatus-dev/drizzle/migrations/${f}_*.sql"
done
```

### Seed data / ad-hoc SQL

```bash
# Run inline SQL
$SSH "PGPASSWORD=Bon1fatusPr0d2026 psql -h localhost -U bonifatus -d bonifatus_dev \
  -c \"INSERT INTO scan_config (key, data) VALUES ('my_key', '\\\"my_value\\\"'::jsonb) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data\""
```

## Secrets Management

Secrets are stored as Docker Swarm external secrets, prefixed by environment (`dev_` or `prod_`). The entrypoint script reads them from `/run/secrets/` and exports them without the prefix.

### Reading secrets

Secrets are only accessible from inside a running container. To read them:

```bash
# 1. Get the container ID
$SSH "docker ps --filter name=bonifatus-dev --format '{{.ID}}'"
# e.g. 750ad176597c

# 2. Read a secret from inside the container
$SSH "docker exec 750ad176597c cat /run/secrets/dev_DATABASE_URL"

# One-liner (dev)
$SSH "docker exec \$(docker ps -q --filter name=bonifatus-dev_app) cat /run/secrets/dev_DATABASE_URL"

# One-liner (prod)
$SSH "docker exec \$(docker ps -q --filter name=bonifatus-prod_app) cat /run/secrets/prod_DATABASE_URL"
```

> **Note:** `cat /run/secrets/*` does NOT work from the host — only from inside the container.

### Required secrets

| Secret                       | Description                          |
| ---------------------------- | ------------------------------------ |
| `{env}_DATABASE_URL`         | PostgreSQL connection string         |
| `{env}_NEXTAUTH_SECRET`      | NextAuth JWT signing secret          |
| `{env}_TURNSTILE_SECRET_KEY` | Cloudflare Turnstile server-side key |
| `{env}_EMAIL_HOST`           | SMTP host                            |
| `{env}_EMAIL_PORT`           | SMTP port                            |
| `{env}_EMAIL_SECURE`         | `true` or `false`                    |
| `{env}_EMAIL_USER`           | SMTP username                        |
| `{env}_EMAIL_PASSWORD`       | SMTP password                        |

### Create or update secrets

```bash
# List all secrets
$SSH "docker secret ls"

# Create a new secret
echo -n "value" | $SSH "docker secret create dev_DATABASE_URL -"

# Update (remove then recreate — requires redeploying the service)
$SSH "docker secret rm dev_DATABASE_URL 2>/dev/null || true"
echo -n "new-value" | $SSH "docker secret create dev_DATABASE_URL -"
```

## Build-Time Variables

Baked into the Next.js client bundle at build time. Not secrets — passed as `--build-arg` during `docker build`.

| Variable                         | Dev                         | Prod                       |
| -------------------------------- | --------------------------- | -------------------------- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `0x4AAAAAACWJz491rhjNxKNi`  | `0x4AAAAAAB7cH7pweCPsYnpL` |
| `NEXT_PUBLIC_APP_URL`            | `https://dev.bonifatus.com` | `https://bonifatus.com`    |
| `NEXT_PUBLIC_DEBUG_LEVEL`        | `verbose`                   | `none`                     |

## Logs

```bash
# Dev (live tail)
$SSH "docker service logs bonifatus-dev_app --tail 100 -f"

# Prod (live tail)
$SSH "docker service logs bonifatus-prod_app --tail 100 -f"

# Last 50 lines (no follow)
$SSH "docker service logs bonifatus-prod_app --tail 50"
```

## Service Status

```bash
# List all stacks and services
$SSH "docker stack ls && docker stack services bonifatus-dev && docker stack services bonifatus-prod"

# Check running containers
$SSH "docker ps --format 'table {{.ID}}\t{{.Names}}\t{{.Status}}'"
```

## Rollback

Docker Swarm keeps the previous task version:

```bash
# Instant rollback (uses previous image)
$SSH "docker service rollback bonifatus-prod_app"
```

For a full code rollback:

```bash
# Check recent commits
$SSH "cd /home/deploy/bonifatus-calculator && git log --oneline -10"

# Reset to a specific commit and rebuild
$SSH "cd /home/deploy/bonifatus-calculator && git reset --hard <commit>"

$SSH "cd /home/deploy/bonifatus-calculator && docker build \
  --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAB7cH7pweCPsYnpL \
  --build-arg NEXT_PUBLIC_APP_URL=https://bonifatus.com \
  --build-arg NEXT_PUBLIC_DEBUG_LEVEL=none \
  -t bonifatus:prod ."

$SSH "docker service update --force --image bonifatus:prod bonifatus-prod_app"
```

## Architecture

```
Client -> nginx (TLS) -> Docker Swarm -> Container (:3000 prod / :3001 dev)
                                              |
                                      docker-entrypoint.sh
                                      (reads /run/secrets/*, strips env prefix,
                                       exports as env vars, runs node server.js)
```

- **Dockerfile**: Multi-stage build (deps -> builder -> runner). Standalone output. Pre-downloads Tesseract language data.
- **docker-entrypoint.sh**: Reads Docker Swarm secrets, strips `dev_`/`prod_` prefix, exports as env vars.
- **docker-stack.{dev,prod}.yml**: Service definition, ports, secrets, health check, restart policy.
- **deploy.sh**: Legacy single-SSH-session script. Works on Linux but **unreliable on Windows** due to heredoc issues. Use the manual step-by-step commands above instead.
