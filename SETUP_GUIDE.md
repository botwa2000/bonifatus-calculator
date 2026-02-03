# Bonifatus Calculator - Hetzner Cloud Deployment Guide

Complete setup guide for deploying Bonifatus Calculator on Hetzner Cloud VPS with PostgreSQL, Nginx, and PM2.

## Infrastructure Overview

| Component       | Technology           | Details                                 |
| --------------- | -------------------- | --------------------------------------- |
| Server          | Hetzner CX22         | 2 vCPU, 4GB RAM, 40GB SSD, ~€5.41/month |
| OS              | Ubuntu 24.04 LTS     | Long-term support                       |
| Runtime         | Node.js 20 LTS       | Via NodeSource                          |
| Database        | PostgreSQL 16        | Self-hosted                             |
| Web Server      | Nginx                | Reverse proxy + SSL                     |
| Process Manager | PM2                  | Auto-restart, logs                      |
| SSL             | Let's Encrypt        | Via Certbot                             |
| Auth            | Supabase Auth        | Managed service (hybrid approach)       |
| Email           | Netcup SMTP          | Existing setup                          |
| Bot Protection  | Cloudflare Turnstile | Existing setup                          |

---

## Phase 1: Server Provisioning (Hetzner Console)

### 1.1 Create Server

1. Log into [Hetzner Cloud Console](https://console.hetzner.cloud)
2. Create new project: `bonifatus-production`
3. Add Server:
   - **Location**: Falkenstein (fsn1) or Nuremberg (nbg1) - Germany for GDPR
   - **Image**: Ubuntu 24.04
   - **Type**: CX22 (€4.51/month)
   - **Networking**: Public IPv4 + IPv6
   - **SSH Key**: Add your public key (see Phase 2)
   - **Name**: `bonifatus-prod`

### 1.2 Create Firewall

1. Go to Firewalls > Create Firewall
2. Name: `bonifatus-firewall`
3. Inbound Rules:
   ```
   TCP 22   (SSH)    - Your IP or 0.0.0.0/0
   TCP 80   (HTTP)   - 0.0.0.0/0
   TCP 443  (HTTPS)  - 0.0.0.0/0
   ```
4. Apply to `bonifatus-prod` server

### 1.3 Enable Backups

1. Select server > Backups > Enable
2. Cost: ~€0.90/month (20% of server cost)
3. Automatic daily backups, 7-day retention

---

## Phase 2: SSH Key Setup

### 2.1 Generate SSH Key (Windows - PowerShell)

```powershell
# Generate ED25519 key (more secure than RSA)
ssh-keygen -t ed25519 -C "bonifatus-hetzner" -f "$env:USERPROFILE\.ssh\bonifatus_hetzner"

# View public key (add this to Hetzner)
Get-Content "$env:USERPROFILE\.ssh\bonifatus_hetzner.pub"
```

### 2.2 Generate SSH Key (Linux/macOS)

```bash
ssh-keygen -t ed25519 -C "bonifatus-hetzner" -f ~/.ssh/bonifatus_hetzner
cat ~/.ssh/bonifatus_hetzner.pub
```

### 2.3 Configure SSH Client

Create/edit `~/.ssh/config` (Windows: `%USERPROFILE%\.ssh\config`):

```
Host bonifatus
    HostName YOUR_SERVER_IP
    User deploy
    IdentityFile ~/.ssh/bonifatus_hetzner
    IdentitiesOnly yes

Host bonifatus-root
    HostName YOUR_SERVER_IP
    User root
    IdentityFile ~/.ssh/bonifatus_hetzner
    IdentitiesOnly yes
```

### 2.4 First Connection

```bash
ssh bonifatus-root
# Or: ssh -i ~/.ssh/bonifatus_hetzner root@YOUR_SERVER_IP
```

---

## Phase 3: Initial Server Setup

### 3.1 Update System

```bash
apt update && apt upgrade -y
apt install -y curl wget git unzip htop
```

### 3.2 Create Deploy User

```bash
# Create user
adduser deploy --gecos "" --disabled-password
usermod -aG sudo deploy

# Passwordless sudo for automation
echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
chmod 440 /etc/sudoers.d/deploy

# Copy SSH keys
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 3.3 Secure SSH

Edit `/etc/ssh/sshd_config`:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

```bash
systemctl restart sshd
# TEST: Open new terminal, verify `ssh bonifatus` works before closing root session!
```

---

## Phase 4: Security Hardening

### 4.1 UFW Firewall

```bash
su - deploy

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw enable
sudo ufw status verbose
```

### 4.2 Fail2ban

```bash
sudo apt install fail2ban -y
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

Edit `/etc/fail2ban/jail.local`, add in `[sshd]` section:

```ini
[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo fail2ban-client status sshd
```

### 4.3 Automatic Security Updates

```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
# Select: Yes
```

---

## Phase 5: Install Dependencies

### 5.1 Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
sudo npm install -g pnpm
node --version && pnpm --version
```

### 5.2 PostgreSQL 16

```bash
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update
sudo apt install postgresql-16 postgresql-contrib-16 -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 5.3 Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5.4 Certbot & PM2

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo npm install -g pm2
```

---

## Phase 6: PostgreSQL Database Setup

### 6.1 Create Database and User

```bash
sudo -u postgres psql
```

```sql
CREATE USER bonifatus WITH PASSWORD 'YOUR_SECURE_PASSWORD_HERE';
CREATE DATABASE bonifatus_prod OWNER bonifatus;
GRANT ALL PRIVILEGES ON DATABASE bonifatus_prod TO bonifatus;
\c bonifatus_prod
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
\q
```

### 6.2 Configure PostgreSQL Security

Edit `/etc/postgresql/16/main/postgresql.conf`:

```
listen_addresses = 'localhost'
port = 5432
```

Edit `/etc/postgresql/16/main/pg_hba.conf`, ensure:

```
local   all   bonifatus   scram-sha-256
host    all   bonifatus   127.0.0.1/32   scram-sha-256
```

```bash
sudo systemctl restart postgresql
psql -U bonifatus -d bonifatus_prod -h localhost -c "SELECT 1;"
```

---

## Phase 7: Application Deployment

### 7.1 Create Application Directory

```bash
sudo mkdir -p /var/www/bonifatus
sudo chown -R deploy:deploy /var/www/bonifatus
sudo chmod -R 755 /var/www/bonifatus
```

### 7.2 Clone Repository

```bash
cd /var/www/bonifatus
git clone https://github.com/YOUR_USERNAME/bonifatus-calculator.git .
```

### 7.3 Create Environment File

Create `/var/www/bonifatus/.env.local`:

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://bonifatus.com

# Database (local PostgreSQL)
DATABASE_URL=postgresql://bonifatus:YOUR_DB_PASSWORD@localhost:5432/bonifatus_prod

# Supabase Auth (hybrid - keep using Supabase for auth)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email (Netcup SMTP)
EMAIL_HOST=mx2eed.netcup.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=no-reply@bonifatus.com
EMAIL_PASSWORD=your-email-password

# Bot Protection (Cloudflare Turnstile)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key
TURNSTILE_SECRET_KEY=your-turnstile-secret-key

# Stripe (for paid subscriptions - add when ready)
# STRIPE_SECRET_KEY=sk_live_xxx
# STRIPE_WEBHOOK_SECRET=whsec_xxx
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### 7.4 Run Database Migrations

```bash
cd /var/www/bonifatus
PGPASSWORD='YOUR_DB_PASSWORD' psql -U bonifatus -d bonifatus_prod -h localhost -f supabase/migrations/20251022_001_initial_schema.sql
PGPASSWORD='YOUR_DB_PASSWORD' psql -U bonifatus -d bonifatus_prod -h localhost -f supabase/migrations/20251207_add_parent_child_invites.sql
```

### 7.5 Build and Start

```bash
cd /var/www/bonifatus
pnpm install --frozen-lockfile
pnpm build

pm2 start npm --name "bonifatus" -- start
pm2 save
pm2 startup systemd -u deploy --hp /home/deploy
# Run the command it outputs
```

---

## Phase 8: Nginx Configuration

### 8.1 Create Site Configuration

Create `/etc/nginx/sites-available/bonifatus`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name bonifatus.com www.bonifatus.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bonifatus.com www.bonifatus.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;

    # Proxy to Next.js
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
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

### 8.2 Enable Site and SSL

```bash
sudo rm /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/bonifatus /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL (after DNS is pointed to server)
sudo certbot --nginx -d bonifatus.com -d www.bonifatus.com
sudo certbot renew --dry-run
```

---

## Phase 9: Backup Configuration

Create `/usr/local/bin/backup-bonifatus.sh`:

```bash
#!/bin/bash
set -e
BACKUP_DIR="/var/backups/bonifatus"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

PGPASSWORD="YOUR_DB_PASSWORD" pg_dump -U bonifatus -h localhost bonifatus_prod | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"
cp /var/www/bonifatus/.env.local "$BACKUP_DIR/env_$TIMESTAMP.backup"
find "$BACKUP_DIR" -type f -mtime +7 -delete
echo "Backup completed: $BACKUP_DIR/db_$TIMESTAMP.sql.gz"
```

```bash
sudo chmod +x /usr/local/bin/backup-bonifatus.sh
sudo crontab -e
# Add: 0 3 * * * /usr/local/bin/backup-bonifatus.sh >> /var/log/bonifatus-backup.log 2>&1
```

---

## Phase 10: Deployment Script

Create `/var/www/bonifatus/deploy.sh`:

```bash
#!/bin/bash
set -e
echo "Starting deployment..."
cd /var/www/bonifatus
git pull origin main
pnpm install --frozen-lockfile
pnpm build
pm2 reload bonifatus
echo "Deployment complete!"
```

```bash
chmod +x /var/www/bonifatus/deploy.sh
```

---

## Quick Reference

| Task              | Command                                   |
| ----------------- | ----------------------------------------- |
| SSH to server     | `ssh bonifatus`                           |
| View app logs     | `pm2 logs bonifatus`                      |
| Restart app       | `pm2 restart bonifatus`                   |
| Deploy update     | `/var/www/bonifatus/deploy.sh`            |
| Check disk        | `df -h`                                   |
| Check memory      | `free -h`                                 |
| Nginx status      | `sudo systemctl status nginx`             |
| PostgreSQL status | `sudo systemctl status postgresql`        |
| Run backup        | `sudo /usr/local/bin/backup-bonifatus.sh` |
| Renew SSL         | `sudo certbot renew`                      |

---

## Troubleshooting

### Application won't start

```bash
pm2 logs bonifatus --lines 200
sudo lsof -i :3000
cd /var/www/bonifatus && pnpm start
```

### Nginx 502 Bad Gateway

```bash
pm2 status
sudo tail -f /var/log/nginx/error.log
pm2 restart bonifatus && sudo systemctl restart nginx
```

### Database connection failed

```bash
sudo systemctl status postgresql
psql -U bonifatus -d bonifatus_prod -h localhost -c "SELECT 1;"
```

### SSL certificate issues

```bash
sudo certbot certificates
sudo certbot renew
sudo nginx -t
```

---

## Security Checklist

- [ ] SSH key authentication only (no passwords)
- [ ] Root login disabled
- [ ] UFW firewall enabled (22, 80, 443 only)
- [ ] Fail2ban active
- [ ] Automatic security updates enabled
- [ ] PostgreSQL listening on localhost only
- [ ] Environment variables secured (600 permissions)
- [ ] SSL/TLS enabled with auto-renewal
- [ ] Regular backups configured
