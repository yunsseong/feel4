#!/bin/sh
set -e

echo "Running database migrations..."
npm run typeorm -- migration:run -d dist/data-source.js

echo "Starting application..."
exec npm run start:prod
