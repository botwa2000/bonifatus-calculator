#!/usr/bin/env bash
set -euo pipefail

# Bonifatus deploy script
# Usage: ./deploy.sh <prod|dev> [--secrets-file path]

# On Windows (Git Bash), OpenSSH may not be in PATH — add it if needed
if ! command -v ssh >/dev/null 2>&1; then
  export PATH="$PATH:/c/Windows/System32/OpenSSH"
fi

if ! command -v ssh >/dev/null 2>&1; then
  echo "Error: ssh not found. Install OpenSSH or add it to PATH."
  exit 1
fi

ENV="${1:-}"
SECRETS_FILE=""

if [[ "$ENV" != "prod" && "$ENV" != "dev" ]]; then
  echo "Usage: ./deploy.sh <prod|dev> [--secrets-file path]"
  exit 1
fi

shift
while [[ $# -gt 0 ]]; do
  case "$1" in
    --secrets-file) SECRETS_FILE="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ "$ENV" == "prod" ]]; then
  PORT=3000
  STACK_FILE="docker-stack.prod.yml"
  DOMAIN="bonifatus.com"
  REPO_DIR="/home/deploy/bonifatus-calculator"
  BRANCH="main"
  IMAGE_TAG="bonifatus:prod"
  APP_URL="https://bonifatus.com"
  TURNSTILE_SITE_KEY="0x4AAAAAAB7cH7pweCPsYnpL"
  DEBUG_LEVEL="none"
else
  PORT=3001
  STACK_FILE="docker-stack.dev.yml"
  DOMAIN="dev.bonifatus.com"
  REPO_DIR="/home/deploy/bonifatus-dev"
  BRANCH="dev"
  IMAGE_TAG="bonifatus:dev"
  APP_URL="https://dev.bonifatus.com"
  TURNSTILE_SITE_KEY="0x4AAAAAACWJz491rhjNxKNi"
  DEBUG_LEVEL="verbose"
fi

STACK_NAME="bonifatus-${ENV}"

# Update secrets if requested
if [[ -n "$SECRETS_FILE" ]]; then
  [[ ! -f "$SECRETS_FILE" ]] && { echo "Error: Secrets file not found: $SECRETS_FILE"; exit 1; }
  echo "==> Updating secrets from ${SECRETS_FILE}"
  while IFS='=' read -r key value; do
    [[ -z "$key" || "$key" == \#* ]] && continue
    secret_name="${ENV}_${key}"
    ssh root@159.69.180.183 "docker secret rm ${secret_name} 2>/dev/null || true"
    echo -n "$value" | ssh root@159.69.180.183 "docker secret create ${secret_name} -"
    echo "   Created: ${secret_name}"
  done < "$SECRETS_FILE"
fi

echo "==> Deploying ${ENV} to bonifatus-hetzner"

# Single SSH session: pull → build → deploy → health check
ssh root@159.69.180.183 bash -s <<EOF
set -euo pipefail

echo "=== [1/5] Pulling latest ${BRANCH} ==="
cd ${REPO_DIR}
git fetch origin
git checkout ${BRANCH}
git pull origin ${BRANCH}

echo "=== [2/5] Building image ${IMAGE_TAG} ==="
docker build \\
  --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=${TURNSTILE_SITE_KEY} \\
  --build-arg NEXT_PUBLIC_APP_URL=${APP_URL} \\
  --build-arg NEXT_PUBLIC_DEBUG_LEVEL=${DEBUG_LEVEL} \\
  -t ${IMAGE_TAG} .

echo "=== [3/5] Deploying stack ${STACK_NAME} ==="
docker stack deploy -c ${STACK_FILE} ${STACK_NAME}

echo "=== [4/5] Forcing service update ==="
docker service update --force --image ${IMAGE_TAG} ${STACK_NAME}_app

echo "=== [5/5] Health check (waiting 20s) ==="
sleep 20
HEALTH=\$(curl -sf http://localhost:${PORT}/api/health || echo 'FAIL')
echo "Response: \$HEALTH"

if echo "\$HEALTH" | grep -q '"status":"ok"'; then
  echo "==> ${DOMAIN} is healthy!"
else
  echo "==> Health check failed. Check logs:"
  echo "    ssh bonifatus-hetzner 'docker service logs ${STACK_NAME}_app --tail 50'"
  exit 1
fi
EOF

echo "==> Done. Verify at https://${DOMAIN}"
