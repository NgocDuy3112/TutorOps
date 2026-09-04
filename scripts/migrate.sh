CONTAINER=${1:-tutorops-postgres}
DB_USER=${2:-${POSTGRES_DB_USER:-postgres}}
DB_NAME=${3:-${POSTGRES_DB_NAME:-tutorops}}
MIGRATIONS_DIR="backend/migrations"

echo "=== TutorOps Migration ==="
echo "Container: $CONTAINER"
echo "Database: $DB_NAME"
echo "User: $DB_NAME"
echo ""

# Create _migrations table if not exists
echo "Creating _migrations table..."
podman exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
  CREATE TABLE IF NOT EXISTS _migrations (
    id serial PRIMARY KEY,
    filename text NOT NULL UNIQUE,
    applied_at timestamptz DEFAULT now()
  );
" 2>/dev/null

# Get already applied migrations
APPLIED=$(podman exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -c "
  SELECT filename FROM _migrations ORDER BY id;
" 2>/dev/null | tr -d '[:space:]')

# Run each migration file
COUNT=0
for file in $(ls "$MIGRATIONS_DIR"/*.sql | sort); do
  filename=$(basename "$file")

  # Skip if already applied
  if echo "$APPLIED" | grep -q "$filename"; then
    echo "SKIP  $filename (already applied)"
    continue
  fi

  echo -n "RUN   $filename... "
  if podman exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -f - < "$file" 2>/dev/null; then
    # Record migration
    podman exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c "
      INSERT INTO _migrations (filename) VALUES ('$filename');
    " 2>/dev/null
    echo "OK"
    COUNT=$((COUNT + 1))
  else
    echo "FAILED"
    exit 1
  fi
done

echo ""
echo "=== Done: $COUNT migration(s) applied ==="
