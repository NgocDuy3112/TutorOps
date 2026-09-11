#!/bin/sh
# Render crontab from BACKUP_CRON env, then run crond in foreground.
set -eu

CRON=${BACKUP_CRON:-"0 2 * * *"}
echo "$CRON /usr/local/bin/backup.sh >> /proc/1/fd/1 2>&1" > /etc/crontabs/root

echo "Backup cron: '$CRON' (retention ${BACKUP_RETENTION:-30})"
exec crond -f -l 8
