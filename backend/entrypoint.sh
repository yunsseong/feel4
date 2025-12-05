#!/bin/sh

echo "Running database migrations..."
npm run typeorm -- migration:run -d dist/data-source.js || echo "Migration failed or already run, continuing..."

echo "Starting application..."
exec npm run start:prod
