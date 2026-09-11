#!/bin/sh
# Dump Postgres, upload to S3, prune old backups.
# Runs inside the backup container (postgres + aws-cli image).
set -eu

: "${S3_BUCKET:?S3_BUCKET required}"
: "${S3_ENDPOINT:?S3_ENDPOINT required}"

PREFIX=${BACKUP_S3_PREFIX:-backups}
RETENTION=${BACKUP_RETENTION:-30}
STAMP=$(date +%Y%m%d-%H%M%S)
FILE="tutorops-${STAMP}.sql.gz"
TMP="/tmp/$FILE"

# Map project env vars to tool expectations
export PGPASSWORD="${POSTGRES_DB_PASSWORD:?POSTGRES_DB_PASSWORD required}"
export AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID:?S3_ACCESS_KEY_ID required}"
export AWS_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY:?S3_SECRET_ACCESS_KEY required}"
export AWS_DEFAULT_REGION="${S3_REGION:-us-east-1}"

AWS="aws --endpoint-url $S3_ENDPOINT"
if [ "${S3_FORCE_PATH_STYLE:-false}" = "true" ]; then
  aws configure set default.s3.addressing_style path
fi

aws_cmd() {
  $AWS "$@"
}

echo "[$(date '+%F %T')] Dumping ${POSTGRES_DB_NAME:-tutorops}..."
pg_dump -h "${POSTGRES_DB_HOST:-postgres}" \
        -U "${POSTGRES_DB_USER:-postgres}" \
        -d "${POSTGRES_DB_NAME:-tutorops}" \
        --no-owner --clean --if-exists | gzip > "$TMP"

if [ ! -s "$TMP" ]; then
  echo "ERROR: dump is empty, aborting" >&2
  rm -f "$TMP"
  exit 1
fi

echo "[$(date '+%F %T')] Uploading s3://$S3_BUCKET/$PREFIX/$FILE..."
aws_cmd s3 cp "$TMP" "s3://$S3_BUCKET/$PREFIX/$FILE"
rm -f "$TMP"

# Prune: keep newest RETENTION files (timestamped names sort chronologically)
echo "[$(date '+%F %T')] Pruning to $RETENTION newest..."
aws_cmd s3api list-objects-v2 --bucket "$S3_BUCKET" --prefix "$PREFIX/" \
  --query "sort(Contents[].Key)[:-${RETENTION}]" --output text \
| while read -r key; do
    [ -n "$key" ] || continue
    echo "  delete $key"
    aws_cmd s3api delete-object --bucket "$S3_BUCKET" --key "$key" >/dev/null
  done

echo "[$(date '+%F %T')] Backup done."
