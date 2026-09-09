set -euo pipefail

GLOBALS_ONLY=0
if [ "${1:-}" = "-g" ]; then
  GLOBALS_ONLY=1
  shift
fi

OUT=${1:-}
CONTAINER=${2:-tutorops-postgres}
DB_USER=${3:-${POSTGRES_DB_USER:-postgres}}

if [ -f configs/.env ]; then
  # shellcheck disable=SC1091
  set -a; source configs/.env; set +a
fi

mkdir -p dumps

if [ -z "$OUT" ]; then
  if [ "$GLOBALS_ONLY" = 1 ]; then
    OUT="dumps/globals-$(date +%Y%m%d-%H%M%S).sql.gz"
  else
    OUT="dumps/cluster-$(date +%Y%m%d-%H%M%S).sql.gz"
  fi
fi

dumpall_cmd() {
  if [ "$GLOBALS_ONLY" = 1 ]; then
    podman exec "$CONTAINER" pg_dumpall -U "$DB_USER" --globals-only
  else
    podman exec "$CONTAINER" pg_dumpall -U "$DB_USER"
  fi
}

if [ "$OUT" = "-" ]; then
  dumpall_cmd
  exit 0
fi

case "$OUT" in
  *.gz)
    dumpall_cmd | gzip > "$OUT"
    ;;
  *)
    dumpall_cmd > "$OUT"
    ;;
esac

echo "Dumped to $OUT ($(du -h "$OUT" | cut -f1))"
