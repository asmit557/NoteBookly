#!/bin/sh
set -e

echo "[startup] running prisma migrate deploy…"
npx prisma migrate deploy

echo "[startup] starting server…"
exec node dist/index.js
