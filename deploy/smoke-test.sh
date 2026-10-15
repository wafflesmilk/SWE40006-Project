#!/usr/bin/env bash
set -Eeuo pipefail

BASE_URL="${1:?Usage: smoke-test.sh <base-url>}"
BASE_URL="${BASE_URL%/}"

for attempt in {1..30}; do
  echo "Health check attempt $attempt"

  if curl \
    --fail \
    --silent \
    --show-error \
    --max-time 5 \
    "$BASE_URL/health" > /dev/null; then
    echo "Application and database are ready"
    exit 0
  fi

  sleep 2
done

echo "Deployment health check failed"
exit 1