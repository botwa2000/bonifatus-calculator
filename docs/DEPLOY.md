# Deployment Playbook

**Server:** Hetzner CX22, `159.69.180.183`, Ubuntu 22.04
**User:** `deploy`
**SSH key:** `~/.ssh/bonifatus_hetzner` (Windows: `%USERPROFILE%\.ssh\bonifatus_hetzner`)
**Runtime:** Docker Swarm (single-node)

| Environment | Branch | Domain              | Port | Repo path on server                 |
| ----------- | ------ | ------------------- | ---- | ----------------------------------- |
| prod        | main   | `bonifatus.com`     | 3000 | `/home/deploy/bonifatus-calculator` |
| dev         | dev    | `dev.bonifatus.com` | 3001 | `/home/deploy/bonifatus-dev`        |

---

## Quick deploy

```bash
# Deploy dev
./deploy.sh dev

# Deploy prod
git checkout main && git merge dev && git push origin main
./deploy.sh prod
```

The script pulls latest code, builds the Docker image with `NEXT_PUBLIC_*` build args, and runs `docker stack deploy`.

---

## Secrets management

Secrets are stored in Docker Swarm (not in `.env.local` files). Each secret is prefixed with the environment: `prod_DATABASE_URL`, `dev_DATABASE_URL`, etc.

### View secrets

```bash
ssh -i "$USERPROFILE/.ssh/bonifatus_hetzner" deploy@159.69.180.183 "docker secret ls"
```

### Create/update secrets from file

Create a secrets file (not committed to git) with `KEY=value` lines:

```
DATABASE_URL=postgresql://user:pass@localhost/db
NEXTAUTH_SECRET=abc123
TURNSTILE_SECRET_KEY=...
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=true
EMAIL_USER=user@example.com
EMAIL_PASSWORD=...
```

Then deploy with:

```bash
./deploy.sh dev --secrets-file .secrets.dev
./deploy.sh prod --secrets-file .secrets.prod
```

This removes and re-creates each secret, then redeploys the stack.

### Create a single secret manually

```bash
echo -n "the_value" | ssh -i "$USERPROFILE/.ssh/bonifatus_hetzner" deploy@159.69.180.183 "docker secret create prod_DATABASE_URL -"
```

### Rotate a secret

```bash
SSH_KEY="$USERPROFILE/.ssh/bonifatus_hetzner"
ssh -i "$SSH_KEY" deploy@159.69.180.183 "docker secret rm prod_NEXTAUTH_SECRET"
echo -n "new_value" | ssh -i "$SSH_KEY" deploy@159.69.180.183 "docker secret create prod_NEXTAUTH_SECRET -"
# Redeploy to pick up the new secret
./deploy.sh prod
```

> **Note:** Removing a secret requires the stack to be down or the secret to not be in use. You may need to `docker stack rm bonifatus-prod` first, then recreate the secret and redeploy.

---

## Rollback

```bash
SSH_KEY="$USERPROFILE/.ssh/bonifatus_hetzner"

# Roll back to previous image (if you tagged it)
ssh -i "$SSH_KEY" deploy@159.69.180.183 "docker service update --image bonifatus:prod-prev bonifatus-prod_app"

# Or force restart with current image
ssh -i "$SSH_KEY" deploy@159.69.180.183 "docker service update --force bonifatus-prod_app"

# Nuclear: remove stack and redeploy
ssh -i "$SSH_KEY" deploy@159.69.180.183 "docker stack rm bonifatus-prod"
./deploy.sh prod
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

# Remove a stack entirely
ssh -i "$SSH_KEY" deploy@159.69.180.183 "docker stack rm bonifatus-prod"

# SSH into the server
ssh -i "$USERPROFILE/.ssh/bonifatus_hetzner" deploy@159.69.180.183
```

---

## Server setup (one-time)

These steps were performed during initial Docker Swarm migration:

1. **Install Docker Engine** via official apt repo
2. **Add deploy user to docker group:** `sudo usermod -aG docker deploy`
3. **Init Swarm:** `docker swarm init`
4. **Create secrets** from existing `.env.local` values (see secrets section above)
5. **Build images and deploy stacks**
6. **Retire PM2:** `pm2 stop all && pm2 delete all && pm2 save && pm2 unstartup`
7. **Remove `.env.local` files** (secrets now in Swarm only)
