#!/usr/bin/env bash
set -euo pipefail

# Bonifatus deploy script
# Usage: ./deploy.sh <prod|dev> [--secrets-file path]

ENV="${1:-}"
SECRETS_FILE="${3:-}"
SERVER="deploy@159.69.180.183"
REPO_DIR="/var/www/bonifatus"

if [[ "$ENV" != "prod" && "$ENV" != "dev" ]]; then
  echo "Usage: ./deploy.sh <prod|dev> [--secrets-file path]"
  exit 1
fi

# Parse optional flags
shift
while [[ $# -gt 0 ]]; do
  case "$1" in
    --secrets-file)
      SECRETS_FILE="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [[ "$ENV" == "prod" ]]; then
  PORT=3000
  STACK_FILE="docker-stack.prod.yml"
  DOMAIN="bonifatus.com"
else
  PORT=3001
  STACK_FILE="docker-stack.dev.yml"
  DOMAIN="dev.bonifatus.com"
fi

STACK_NAME="bonifatus-${ENV}"

echo "==> Deploying ${ENV} environment to ${SERVER}"

# Step 1: Update secrets if a secrets file is provided
if [[ -n "$SECRETS_FILE" ]]; then
  if [[ ! -f "$SECRETS_FILE" ]]; then
    echo "Error: Secrets file not found: $SECRETS_FILE"
    exit 1
  fi

  echo "==> Updating Docker secrets from ${SECRETS_FILE}"
  while IFS='=' read -r key value; do
    # Skip comments and empty lines
    [[ -z "$key" || "$key" == \#* ]] && continue
    secret_name="${ENV}_${key}"
    # Remove existing secret (ignore errors if it doesn't exist)
    ssh "$SERVER" "docker secret rm ${secret_name} 2>/dev/null || true"
    # Create new secret
    echo -n "$value" | ssh "$SERVER" "docker secret create ${secret_name} -"
    echo "   Secret: ${secret_name}"
  done < "$SECRETS_FILE"
fi

# Step 2: Pull latest code and build
echo "==> Pulling latest code and building image"
ssh "$SERVER" "cd ${REPO_DIR} && git pull && docker build -t bonifatus:latest ."

# Step 3: Deploy stack
echo "==> Deploying stack: ${STACK_NAME}"
ssh "$SERVER" "cd ${REPO_DIR} && docker stack deploy -c ${STACK_FILE} ${STACK_NAME}"

# Step 4: Wait for service to be ready
echo "==> Waiting for service to start..."
sleep 15

# Step 5: Health check
echo "==> Running health check on port ${PORT}"
HEALTH=$(ssh "$SERVER" "curl -sf http://localhost:${PORT}/api/health || echo 'FAIL'")

if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "==> Deployment successful! ${DOMAIN} is healthy."
else
  echo "==> WARNING: Health check failed. Check logs with:"
  echo "   ssh ${SERVER} docker service logs ${STACK_NAME}_app"
  exit 1
fi

echo "==> Done. Verify at https://${DOMAIN}"
