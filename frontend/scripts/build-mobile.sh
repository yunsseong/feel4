#!/bin/bash

set -e

echo "📱 Building mobile app..."

# Backup admin folder (move outside app directory)
echo "🔄 Temporarily moving admin folder..."
if [ -d "app/admin" ]; then
  mv app/admin ../admin_backup_temp
fi

# Build Next.js for mobile
echo "🔨 Building Next.js..."
npm run build

# Restore admin folder
echo "🔄 Restoring admin folder..."
if [ -d "../admin_backup_temp" ]; then
  mv ../admin_backup_temp app/admin
fi

echo "✅ Mobile build complete!"
echo "📦 Output directory: out/"
