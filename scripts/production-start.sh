#!/usr/bin/env bash
set -euo pipefail
npx --prefix server prisma migrate deploy
exec node server/src/index.js
