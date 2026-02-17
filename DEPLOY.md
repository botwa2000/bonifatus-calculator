# Deployment Guide

Bonifatus is deployed to a **Hetzner VPS** using **Docker Swarm**. Two environments run on the same server.

|            | Dev                    | Prod                    |
| ---------- | ---------------------- | ----------------------- |
| Domain     | dev.bonifatus.com      | bonifatus.com           |
| Branch     | `dev`                  | `main`                  |
| Port       | 3001                   | 3000                    |
| Stack      | `bonifatus-dev`        | `bonifatus-prod`        |
| Image      | `bonifatus:dev`        | `bonifatus:prod`        |
| Stack file | `docker-stack.dev.yml` | `docker-stack.prod.yml` |

## SSH Setup (one-time)

Add this to `~/.ssh/config` (already done — do not repeat):

```
Host bonifatus-hetzner
  HostName 159.69.180.183
  User root
  BatchMode yes
  ServerAliveInterval 60
  ServerAliveCountMax 10
```

After this, all SSH commands use `ssh root@159.69.180.183` — no `-i` flag, no key path issues.

Test it:

```bash
ssh root@159.69.180.183 "echo connected"
```

## Deployment

### Deploy to dev

```bash
./deploy.sh dev
```

### Deploy to prod

```bash
# 1. Merge dev into main
git checkout main
git merge dev
git push origin main

# 2. Deploy
./deploy.sh prod
```

Both commands run a single SSH session that:

1. `git pull` the correct branch
2. `docker build` with the correct build args
3. `docker stack deploy` the stack
4. `docker service update --force` to pick up the new image
5. Wait 20s then health-check `http://localhost:{port}/api/health`

**Time:** ~5–8 minutes (mostly the Docker build).

## Secrets Management

Secrets are stored as Docker Swarm external secrets, prefixed by environment (`dev_` or `prod_`). The entrypoint script reads them from `/run/secrets/` and exports them without the prefix.

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
# Single secret
echo -n "value" | ssh root@159.69.180.183 "docker secret create dev_DATABASE_URL -"

# Update (remove then recreate)
ssh root@159.69.180.183 "docker secret rm dev_DATABASE_URL 2>/dev/null || true"
echo -n "new-value" | ssh root@159.69.180.183 "docker secret create dev_DATABASE_URL -"

# Bulk update from file (KEY=value lines, no quotes, no export)
./deploy.sh dev --secrets-file .env.dev.secrets
```

### List secrets

```bash
ssh root@159.69.180.183 "docker secret ls"
```

## Build-Time Variables

Baked into the Next.js client bundle at build time. Not secrets — defined in `deploy.sh`.

| Variable                         | Dev                         | Prod                       |
| -------------------------------- | --------------------------- | -------------------------- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `0x4AAAAAACWJz491rhjNxKNi`  | `0x4AAAAAAB7cH7pweCPsYnpL` |
| `NEXT_PUBLIC_APP_URL`            | `https://dev.bonifatus.com` | `https://bonifatus.com`    |
| `NEXT_PUBLIC_DEBUG_LEVEL`        | `verbose`                   | `none`                     |

## Logs

```bash
# Dev
ssh root@159.69.180.183 "docker service logs bonifatus-dev_app --tail 100 -f"

# Prod
ssh root@159.69.180.183 "docker service logs bonifatus-prod_app --tail 100 -f"
```

## Service Status

```bash
# List all stacks and services
ssh root@159.69.180.183 "docker stack ls && docker stack services bonifatus-dev && docker stack services bonifatus-prod"
```

## Rollback

Docker Swarm keeps the previous task version:

```bash
# Instant rollback (uses previous image)
ssh root@159.69.180.183 "docker service rollback bonifatus-prod_app"
```

For a full code rollback:

```bash
ssh root@159.69.180.183 bash -s <<'EOF'
cd /home/deploy/bonifatus-calculator
git log --oneline -10
EOF

# Then reset to a specific commit and redeploy
ssh root@159.69.180.183 bash -s <<'EOF'
cd /home/deploy/bonifatus-calculator
git reset --hard <commit>
docker build \
  --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAB7cH7pweCPsYnpL \
  --build-arg NEXT_PUBLIC_APP_URL=https://bonifatus.com \
  --build-arg NEXT_PUBLIC_DEBUG_LEVEL=none \
  -t bonifatus:prod .
docker service update --force --image bonifatus:prod bonifatus-prod_app
EOF
```

## Database Migrations

Run after deployment if schema changes were made:

```bash
# Dev
ssh root@159.69.180.183 "export DATABASE_URL=\$(cat /run/secrets/dev_DATABASE_URL) && cd /home/deploy/bonifatus-dev && npx drizzle-kit migrate"

# Prod
ssh root@159.69.180.183 "export DATABASE_URL=\$(cat /run/secrets/prod_DATABASE_URL) && cd /home/deploy/bonifatus-calculator && npx drizzle-kit migrate"
```

## Architecture

```
Client → nginx (TLS) → Docker Swarm → Container (:3000 prod / :3001 dev)
                                            |
                                    docker-entrypoint.sh
                                    (reads /run/secrets/*, strips env prefix,
                                     exports as env vars, runs node server.js)
```

- **Dockerfile**: Multi-stage build (deps → builder → runner). Standalone output. Pre-downloads Tesseract language data.
- **docker-entrypoint.sh**: Reads Docker Swarm secrets, strips `dev_`/`prod_` prefix, exports as env vars.
- **docker-stack.{dev,prod}.yml**: Service definition, ports, secrets, health check, restart policy.
- **deploy.sh**: Single SSH session — git pull, docker build, stack deploy, force update, health check.
- **~/.ssh/config**: Host alias `bonifatus-hetzner` so no `-i` flag needed anywhere.
