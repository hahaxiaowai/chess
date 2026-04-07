#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
ENV_FILE=${ENV_FILE:-"$ROOT_DIR/.env.host"}
COMPOSE_FILE="$ROOT_DIR/docker-compose.host-nginx.yml"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing env file: $ENV_FILE" >&2
  echo "Copy $ROOT_DIR/.env.host.example to .env.host and set APP_IMAGE first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

APP_PORT=${APP_PORT:-3001}

echo "Deploying app container with host Nginx mode"
echo "compose: $COMPOSE_FILE"
echo "env:     $ENV_FILE"

if docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull; then
  echo "Image pull succeeded"
else
  echo "Image pull failed, continuing with any locally available image" >&2
fi

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

attempt=1
while [ "$attempt" -le 15 ]; do
  if curl --fail --silent --show-error "http://127.0.0.1:${APP_PORT}/healthz" >/dev/null; then
    echo "Health check passed on http://127.0.0.1:${APP_PORT}/healthz"
    exit 0
  fi

  echo "Waiting for app health check (${attempt}/15)"
  sleep 2
  attempt=$((attempt + 1))
done

echo "App did not become healthy in time. Recent logs:" >&2
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=50 app >&2
exit 1
