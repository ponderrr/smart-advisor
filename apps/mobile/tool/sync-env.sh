#!/usr/bin/env bash
# Generates apps/mobile/.env (git-ignored) from the repo-root .env.local so a
# bare `flutter run` works. Re-run whenever the Supabase creds change.
# Only the two client-public values are copied — never the service-role key.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$MOBILE_DIR/../.." && pwd)"
SRC="$REPO_ROOT/.env.local"
DEST="$MOBILE_DIR/.env"

if [[ ! -f "$SRC" ]]; then
  echo "Missing $SRC (repo root)." >&2
  exit 1
fi

URL="$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' "$SRC" | head -1 | cut -d= -f2-)"
KEY="$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$SRC" | head -1 | cut -d= -f2-)"

if [[ -z "${URL:-}" || -z "${KEY:-}" ]]; then
  echo "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not found in $SRC" >&2
  exit 1
fi

cat > "$DEST" <<EOF
SUPABASE_URL=$URL
SUPABASE_ANON_KEY=$KEY
EOF

echo "Wrote $DEST"
