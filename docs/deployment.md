# Infrastructure Reference

## Architecture

```
Nginx (host-level, port 80/443, SSL via Certbot)
  ├── bonifatus.com      → Docker container (port 3000)
  └── dev.bonifatus.com  → Docker container (port 3001)

PostgreSQL 16 (host-level, self-hosted)

Docker Swarm (single-node)
  ├── stack: bonifatus-prod  (secrets: prod_*)
  └── stack: bonifatus-dev   (secrets: dev_*)
```

**Server:** Hetzner CX22, `159.69.180.183`, Ubuntu 22.04

## Prerequisites

- SSH access to the server as `deploy` user
- SSH key at `~/.ssh/bonifatus_hetzner`
- DNS A records pointing to 159.69.180.183:
  - `bonifatus.com` → 159.69.180.183
  - `dev.bonifatus.com` → 159.69.180.183

## Server Setup (one-time)

### 1. Install Docker

```bash
sudo apt update && sudo apt install -y docker.io
sudo systemctl enable --now docker
sudo usermod -aG docker deploy
```

### 2. Initialize Docker Swarm

```bash
docker swarm init
```

### 3. Configure SSH for GitHub

Create `~/.ssh/config` on the server:

```
Host github.com
  IdentityFile ~/.ssh/bonifatus_deploy_key
  StrictHostKeyChecking no
```

Ensure the deploy key is at `~/.ssh/bonifatus_deploy_key` with permissions `600`.

### 4. Clone the repository

```bash
sudo mkdir -p /var/www/bonifatus
sudo chown deploy:deploy /var/www/bonifatus
git clone git@github.com:botwa2000/bonifatus-calculator.git /var/www/bonifatus
```

### 5. Install and configure Nginx

```bash
sudo apt install -y nginx
```

Create `/etc/nginx/sites-available/bonifatus`:

```nginx
# Production
server {
    listen 80;
    server_name bonifatus.com www.bonifatus.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Development
server {
    listen 80;
    server_name dev.bonifatus.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bonifatus /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 6. SSL with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d bonifatus.com -d www.bonifatus.com -d dev.bonifatus.com
```

## Docker Secrets

Secrets are stored in Docker Swarm's encrypted secret store and mounted as files at `/run/secrets/` inside containers. The `docker-entrypoint.sh` script reads these and exports them as environment variables.

Create a secrets file locally (never on the server):

```
TURNSTILE_SECRET_KEY=your_key_here
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=true
EMAIL_USER=user@example.com
EMAIL_PASSWORD=your_password
```

Deploy with secrets:

```bash
./deploy.sh prod --secrets-file .secrets.prod
./deploy.sh dev --secrets-file .secrets.dev
```

To rotate a secret: re-deploy with `--secrets-file` (the script removes and recreates secrets).

## Build-time Variables (NEXT*PUBLIC*\*)

`NEXT_PUBLIC_*` variables are baked into the client JavaScript at build time. To set them, pass build args when building:

```bash
docker build \
  --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x... \
  --build-arg NEXT_PUBLIC_APP_URL=https://bonifatus.com \
  -t bonifatus:latest .
```

Since prod and dev need different `NEXT_PUBLIC_*` values, you'll need separate image tags.

## Verification Checklist

- [ ] `curl https://bonifatus.com/api/health` returns `{"status":"ok"}`
- [ ] `curl https://dev.bonifatus.com/api/health` returns `{"status":"ok"}`
- [ ] `docker service ls` shows both services running
- [ ] `docker secret ls` shows secrets exist
- [ ] No `.env` files exist on the server
