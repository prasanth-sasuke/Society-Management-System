#!/usr/bin/env bash
set -euo pipefail
# Migrations need the unpooled URL. The running app keeps DATABASE_URL (pooled).
migrate_url="${DIRECT_URL:-$DATABASE_URL}"
DATABASE_URL="$migrate_url" DIRECT_URL="$migrate_url" npx --prefix server prisma migrate deploy
exec node server/src/index.js
