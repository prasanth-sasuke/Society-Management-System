#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
# Migrations need the unpooled URL. The running app keeps DATABASE_URL (pooled).
migrate_url="${DIRECT_URL:-$DATABASE_URL}"
(cd server && DATABASE_URL="$migrate_url" DIRECT_URL="$migrate_url" npx prisma migrate deploy)
exec node server/src/index.js
