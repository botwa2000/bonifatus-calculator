# Deployment Playbook

**Server:** Hetzner CX22, `159.69.180.183`, Ubuntu 22.04
**SSH key:** `~/.ssh/bonifatus_hetzner` (Windows: `%USERPROFILE%\.ssh\bonifatus_hetzner`)

---

## Step 1: Commit and push

```bash
git add -A && git commit -m "Your commit message" && git push origin dev
```

## Step 2: Deploy to dev

```bash
SSH_KEY="$USERPROFILE/.ssh/bonifatus_hetzner" && ssh -i "$SSH_KEY" deploy@159.69.180.183 "cd /var/www/bonifatus && git fetch origin && git checkout dev && git pull origin dev && docker build -t bonifatus:dev . && docker stack deploy -c docker-stack.dev.yml bonifatus-dev" && sleep 15 && ssh -i "$SSH_KEY" deploy@159.69.180.183 "curl -sf http://localhost:3001/api/health" && echo "==> Dev deployed: https://dev.bonifatus.com"
```

Verify at `https://dev.bonifatus.com`. If something is wrong, check logs:

```bash
ssh -i "$USERPROFILE/.ssh/bonifatus_hetzner" deploy@159.69.180.183 "docker service logs bonifatus-dev_app --tail 100"
```

## Step 3: Deploy to prod

```bash
git checkout main && git merge dev && git push origin main && SSH_KEY="$USERPROFILE/.ssh/bonifatus_hetzner" && ssh -i "$SSH_KEY" deploy@159.69.180.183 "cd /var/www/bonifatus && git fetch origin && git checkout main && git pull origin main && docker build -t bonifatus:prod . && docker stack deploy -c docker-stack.prod.yml bonifatus-prod" && sleep 15 && ssh -i "$SSH_KEY" deploy@159.69.180.183 "curl -sf http://localhost:3000/api/health" && echo "==> Prod deployed: https://bonifatus.com"
```

---

## Database migrations

Run migrations **before** deploying if schema changes are needed.

Single command:

```bash
ssh -i "$USERPROFILE/.ssh/bonifatus_hetzner" deploy@159.69.180.183 "sudo -u postgres psql -d bonifatus_prod -c \"YOUR SQL HERE;\""
```

From a file:

```bash
SSH_KEY="$USERPROFILE/.ssh/bonifatus_hetzner" && scp -i "$SSH_KEY" drizzle/migrations/your_migration.sql deploy@159.69.180.183:/tmp/ && ssh -i "$SSH_KEY" deploy@159.69.180.183 "sudo -u postgres psql -d bonifatus_prod -f /tmp/your_migration.sql"
```

Interactive session:

```bash
ssh -i "$USERPROFILE/.ssh/bonifatus_hetzner" deploy@159.69.180.183 "sudo -u postgres psql -d bonifatus_prod"
```

### Database details

| Property | Value                                       |
| -------- | ------------------------------------------- |
| Database | `bonifatus_prod`                            |
| Access   | `sudo -u postgres psql` (peer auth via SSH) |

### Applied migrations

| Date       | File                                    | Description                                              |
| ---------- | --------------------------------------- | -------------------------------------------------------- |
| 2025-10-22 | `20251022_001_initial_schema.sql`       | Initial schema                                           |
| 2025-12-07 | `20251207_add_parent_child_invites.sql` | Parent-child invites                                     |
| 2026-01-31 | `add-admin-role.sql`                    | Add `admin` role, set `bonifatus.app@gmail.com` as admin |

---

## Useful commands

```bash
SSH_KEY="$USERPROFILE/.ssh/bonifatus_hetzner"

# View running services
ssh -i "$SSH_KEY" deploy@159.69.180.183 "docker service ls"

# View logs
ssh -i "$SSH_KEY" deploy@159.69.180.183 "docker service logs bonifatus-prod_app --tail 100"
ssh -i "$SSH_KEY" deploy@159.69.180.183 "docker service logs bonifatus-dev_app --tail 100"

# Force restart
ssh -i "$SSH_KEY" deploy@159.69.180.183 "docker service update --force bonifatus-prod_app"

# List secrets
ssh -i "$SSH_KEY" deploy@159.69.180.183 "docker secret ls"

# Update secrets (re-deploy with secrets file)
./deploy.sh prod --secrets-file .secrets.prod
./deploy.sh dev --secrets-file .secrets.dev
```
