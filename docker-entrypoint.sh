#!/bin/sh
set -e

# Read Docker Swarm secrets and export them as environment variables.
# Secret files are mounted at /run/secrets/<secret_name>.
# Secret names follow the pattern: {env}_VARIABLE_NAME (e.g., prod_DATABASE_URL)
# The env prefix is stripped so the app sees DATABASE_URL.

SECRETS_DIR="/run/secrets"

if [ -d "$SECRETS_DIR" ]; then
  for secret_file in "$SECRETS_DIR"/*; do
    if [ -f "$secret_file" ]; then
      secret_name=$(basename "$secret_file")
      # Strip env prefix (prod_ or dev_)
      var_name=$(echo "$secret_name" | sed 's/^prod_//;s/^dev_//')
      export "$var_name"="$(tr -d '\r\n' < "$secret_file")"
    fi
  done
fi

# In Docker, `localhost` in DATABASE_URL refers to the container loopback, not the host.
# Replace with host.docker.internal (mapped to the Docker host via extra_hosts in the stack).
if [ -n "$DATABASE_URL" ]; then
  DATABASE_URL=$(echo "$DATABASE_URL" | sed 's|@localhost:|@host.docker.internal:|')
  export DATABASE_URL
fi

exec "$@"
