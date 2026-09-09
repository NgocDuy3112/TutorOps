#!/usr/bin/env bash
# Trigger backup ngay trong container backup đang chạy.
# Usage: ./scripts/db-backup.sh
set -euo pipefail

CONTAINER=${1:-tutorops-backup}

if podman exec "$CONTAINER" /usr/local/bin/backup.sh; then
  exit 0
fi

echo "Container '$CONTAINER' is not running. Starts with:"
echo "  podman compose -f docker-compose-dev.yaml --env-file ./configs/.env up -d backup"
exit 1
