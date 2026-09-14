#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
# prisma generate reads schema env() keys; a dummy URL is enough (no live DB).
export DATABASE_URL="${DATABASE_URL:-postgresql://build:build@127.0.0.1:5432/build}"
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"
export NODE_ENV=production
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=384}"

(cd server && npm ci && npx prisma generate)
(cd web && npm ci && npm run build)
