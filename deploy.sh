#!/usr/bin/env bash
set -euo pipefail

# Bonifatus deploy script — Docker Swarm edition
# Usage: ./deploy.sh <prod|dev> [--secrets-file path]

ENV="${1:-}"
SECRETS_FILE=""
SSH_KEY="${HOME}/.ssh/bonifatus_hetzner"
SERVER="deploy@159.69.180.183"
SSH_OPTS="-i ${SSH_KEY} -o BatchMode=yes"

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
    ssh $SSH_OPTS "$SERVER" "docker secret rm ${secret_name} 2>/dev/null || true"
    # Create new secret
    echo -n "$value" | ssh $SSH_OPTS "$SERVER" "docker secret create ${secret_name} -"
    echo "   Secret: ${secret_name}"
  done < "$SECRETS_FILE"
fi

# Step 2: Pull latest code and build image with build args
echo "==> Pulling latest code and building image"
ssh $SSH_OPTS "$SERVER" bash -s <<EOF
  cd ${REPO_DIR}
  git fetch origin
  git checkout ${BRANCH}
  git pull origin ${BRANCH}
  docker build \
    --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=${TURNSTILE_SITE_KEY} \
    --build-arg NEXT_PUBLIC_APP_URL=${APP_URL} \
    --build-arg NEXT_PUBLIC_DEBUG_LEVEL=${DEBUG_LEVEL} \
    -t ${IMAGE_TAG} .
EOF

# Step 3: Deploy stack
echo "==> Deploying stack: ${STACK_NAME}"
ssh $SSH_OPTS "$SERVER" "cd ${REPO_DIR} && docker stack deploy -c ${STACK_FILE} ${STACK_NAME}"

# Step 4: Force container replacement (local images have no registry digest,
# so docker stack deploy alone won't detect image changes)
echo "==> Forcing service update to pick up new image"
ssh $SSH_OPTS "$SERVER" "docker service update --force --image ${IMAGE_TAG} ${STACK_NAME}_app"

# Step 5: Wait for service to be ready
echo "==> Waiting for service to start..."
sleep 10

# Step 6: Health check
echo "==> Running health check on port ${PORT}"
HEALTH=$(ssh $SSH_OPTS "$SERVER" "curl -sf http://localhost:${PORT}/api/health || echo 'FAIL'")

if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "==> Deployment successful! ${DOMAIN} is healthy."
else
  echo "==> WARNING: Health check failed. Check logs with:"
  echo "   ssh ${SERVER} docker service logs ${STACK_NAME}_app"
  exit 1
fi

echo "==> Done. Verify at https://${DOMAIN}"
