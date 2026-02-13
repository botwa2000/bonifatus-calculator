# Deployment Guide

Bonifatus is deployed to a **Hetzner VPS** using **Docker Swarm**. Two environments run on the same server, each with its own stack, secrets, and domain.

|               | Dev                    | Prod                    |
| ------------- | ---------------------- | ----------------------- |
| Domain        | dev.bonifatus.com      | bonifatus.com           |
| Branch        | `dev`                  | `main`                  |
| External port | 3001                   | 3000                    |
| Stack name    | `bonifatus-dev`        | `bonifatus-prod`        |
| Image tag     | `bonifatus:dev`        | `bonifatus:prod`        |
| Stack file    | `docker-stack.dev.yml` | `docker-stack.prod.yml` |
| Debug level   | verbose                | none                    |

## Prerequisites

- SSH key at `~/.ssh/bonifatus_hetzner` with access to `deploy@159.69.180.183`
- Git repos cloned on the server at `/home/deploy/bonifatus-calculator` (prod) and `/home/deploy/bonifatus-dev` (dev)
- Docker Swarm initialized on the server (`docker swarm init`)
- Caddy or reverse proxy forwarding `bonifatus.com:443 -> :3000` and `dev.bonifatus.com:443 -> :3001`

## Secrets Management

All sensitive configuration is stored as **Docker Swarm external secrets**, not in files. Secrets are prefixed by environment (`dev_` or `prod_`) and the entrypoint script strips the prefix at runtime.

### Required secrets per environment

| Secret name                  | Description                          |
| ---------------------------- | ------------------------------------ |
| `{env}_DATABASE_URL`         | PostgreSQL connection string         |
| `{env}_NEXTAUTH_SECRET`      | NextAuth JWT signing secret          |
| `{env}_TURNSTILE_SECRET_KEY` | Cloudflare Turnstile server-side key |
| `{env}_EMAIL_HOST`           | SMTP host                            |
| `{env}_EMAIL_PORT`           | SMTP port                            |
| `{env}_EMAIL_SECURE`         | SMTP TLS (`true`/`false`)            |
| `{env}_EMAIL_USER`           | SMTP username                        |
| `{env}_EMAIL_PASSWORD`       | SMTP password                        |

### Creating/updating secrets

```bash
# Create a single secret
echo -n "your-value" | ssh -i ~/.ssh/bonifatus_hetzner deploy@159.69.180.183 \
  "docker secret create dev_DATABASE_URL -"

# Update a secret (must remove then recreate)
ssh -i ~/.ssh/bonifatus_hetzner deploy@159.69.180.183 \
  "docker secret rm dev_DATABASE_URL 2>/dev/null || true"
echo -n "new-value" | ssh -i ~/.ssh/bonifatus_hetzner deploy@159.69.180.183 \
  "docker secret create dev_DATABASE_URL -"

# Bulk update from a secrets file
./deploy.sh dev --secrets-file .env.dev.secrets
```

The secrets file format is plain `KEY=value` lines (no quotes, no `export`):

```
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_SECRET=some-random-string
TURNSTILE_SECRET_KEY=0x4AAA...
```

## Build-Time Variables

These are baked into the Next.js client bundle at build time via Docker `--build-arg`. They are **not** secrets and are defined in `deploy.sh`:

| Variable                         | Dev                         | Prod                       |
| -------------------------------- | --------------------------- | -------------------------- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `0x4AAAAAACWJz491rhjNxKNi`  | `0x4AAAAAAB7cH7pweCPsYnpL` |
| `NEXT_PUBLIC_APP_URL`            | `https://dev.bonifatus.com` | `https://bonifatus.com`    |
| `NEXT_PUBLIC_DEBUG_LEVEL`        | `verbose`                   | `none`                     |

## Deployment Procedure

### 1. Commit and push

```bash
# On your local machine
git add <files>
git commit -m "Description of changes"
git push origin dev
```

### 2. Deploy to dev

```bash
./deploy.sh dev
```

This will:

1. SSH to the server, pull latest `dev` branch
2. Build Docker image `bonifatus:dev` with dev build args
3. Deploy stack `bonifatus-dev` using `docker-stack.dev.yml`
4. Force service update to pick up the new image
5. Wait 10 seconds, then run health check on port 3001

### 3. Verify dev

- Check health: `curl https://dev.bonifatus.com/api/health`
- Check the site: open `https://dev.bonifatus.com` in a browser
- Test login, registration, and key flows
- Check logs if needed:
  ```bash
  ssh -i ~/.ssh/bonifatus_hetzner deploy@159.69.180.183 \
    "docker service logs bonifatus-dev_app --tail 100"
  ```

### 4. Merge to main and deploy to prod

```bash
# Merge dev into main
git checkout main
git merge dev
git push origin main

# Deploy to production
./deploy.sh prod
```

### 5. Verify prod

- Check health: `curl https://bonifatus.com/api/health`
- Check the site: open `https://bonifatus.com` in a browser
- Smoke test login and core features

## Database Migrations

Migrations use Drizzle Kit. Run them on the server after deployment if schema changes were made:

```bash
ssh -i ~/.ssh/bonifatus_hetzner deploy@159.69.180.183 bash -c '
  cd /home/deploy/bonifatus-dev  # or bonifatus-calculator for prod
  export DATABASE_URL="$(cat /run/secrets/dev_DATABASE_URL)"
  npx drizzle-kit migrate
'
```

## Debug Logging

Debug output is controlled by `NEXT_PUBLIC_DEBUG_LEVEL` (a build-time variable):

| Level     | Behavior                                                       |
| --------- | -------------------------------------------------------------- |
| `verbose` | All `dbg()`, `dbgWarn()`, `dbgError()` calls output to console |
| `basic`   | Only `dbgWarn()` and `dbgError()` output to console            |
| `none`    | No debug output                                                |

Dev is set to `verbose`, prod to `none`. To temporarily enable debug on prod, rebuild with `--build-arg NEXT_PUBLIC_DEBUG_LEVEL=basic`.

View logs:

```bash
# Dev logs (verbose debug enabled)
ssh -i ~/.ssh/bonifatus_hetzner deploy@159.69.180.183 \
  "docker service logs bonifatus-dev_app --tail 200 -f"

# Prod logs
ssh -i ~/.ssh/bonifatus_hetzner deploy@159.69.180.183 \
  "docker service logs bonifatus-prod_app --tail 200 -f"
```

## Rollback

If a deployment fails:

```bash
# Check which services are running
ssh -i ~/.ssh/bonifatus_hetzner deploy@159.69.180.183 \
  "docker service ls"

# View recent logs for errors
ssh -i ~/.ssh/bonifatus_hetzner deploy@159.69.180.183 \
  "docker service logs bonifatus-dev_app --tail 50"

# Rollback to previous image (Swarm keeps the previous version)
ssh -i ~/.ssh/bonifatus_hetzner deploy@159.69.180.183 \
  "docker service rollback bonifatus-dev_app"
```

For a full rollback, reset the branch on the server and rebuild:

```bash
ssh -i ~/.ssh/bonifatus_hetzner deploy@159.69.180.183 bash -c '
  cd /home/deploy/bonifatus-dev
  git reset --hard HEAD~1
  docker build --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACWJz491rhjNxKNi \
    --build-arg NEXT_PUBLIC_APP_URL=https://dev.bonifatus.com \
    --build-arg NEXT_PUBLIC_DEBUG_LEVEL=verbose \
    -t bonifatus:dev .
  docker service update --force --image bonifatus:dev bonifatus-dev_app
'
```

## Architecture Overview

```
Client -> Caddy (TLS) -> Docker Swarm -> Container (port 3000)
                                            |
                                    docker-entrypoint.sh
                                    (reads /run/secrets/*, strips env prefix,
                                     exports as env vars, then runs node server.js)
```

- **Dockerfile**: Multi-stage build (deps -> builder -> runner). Standalone output mode.
- **docker-entrypoint.sh**: Reads Docker Swarm secrets from `/run/secrets/`, strips `dev_`/`prod_` prefix, exports as environment variables.
- **docker-stack.{dev,prod}.yml**: Defines service, ports, secrets, health check, and restart policy.
- **deploy.sh**: Orchestrates the full deploy: SSH to server, git pull, docker build, stack deploy, force update, health check.
