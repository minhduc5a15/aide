#!/bin/sh
set -e

echo "Deploying database migrations..."
npx prisma migrate deploy

echo "Starting Next.js server..."
exec node server.js
