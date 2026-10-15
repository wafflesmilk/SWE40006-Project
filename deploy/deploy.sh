#!/usr/bin/env bash
set -Eeuo pipefail

APP_IMAGE="${1:?Usage: deploy.sh <image>}"
export APP_IMAGE

DEPLOY_DIR="${DEPLOY_DIR:-/opt/notes-app}"
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-$DEPLOY_DIR/.env}"
PROJECT_NAME="${COMPOSE_PROJECT_NAME:-online-notes}"

COMPOSE=(
  docker compose
  -p "$PROJECT_NAME"
  --env-file "$DEPLOY_ENV_FILE"
  -f "$DEPLOY_DIR/deploy/compose.deploy.yml"
)

echo "Deploying $APP_IMAGE"

"${COMPOSE[@]}" config -q
"${COMPOSE[@]}" up -d --wait --wait-timeout 120 db
"${COMPOSE[@]}" pull app
"${COMPOSE[@]}" up -d --no-deps app
"${COMPOSE[@]}" ps

echo "Deployment complete"