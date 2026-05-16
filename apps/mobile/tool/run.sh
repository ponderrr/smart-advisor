#!/usr/bin/env bash
# Runs the Flutter app using the Supabase client-public creds from the repo's
# existing .env.local — so secrets live in ONE place, never duplicated here.
#
# Usage:  ./tool/run.sh [flutter run args...]
#   e.g.  ./tool/run.sh -d emulator-5554
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.local"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE (repo root). Cannot source Supabase config." >&2
  exit 1
fi

# Pull only the two client-public values; never the service-role key.
SUPABASE_URL="$(grep -E '^NEXT_PUBLIC_SUPABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2-)"
SUPABASE_ANON_KEY="$(grep -E '^NEXT_PUBLIC_SUPABASE_ANON_KEY=' "$ENV_FILE" | head -1 | cut -d= -f2-)"

if [[ -z "${SUPABASE_URL:-}" || -z "${SUPABASE_ANON_KEY:-}" ]]; then
  echo "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not found in $ENV_FILE" >&2
  exit 1
fi

cd "$SCRIPT_DIR/.."
exec flutter run \
  --dart-define=SUPABASE_URL="$SUPABASE_URL" \
  --dart-define=SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  "$@"
