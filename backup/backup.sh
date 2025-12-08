#!/bin/bash
set -euo pipefail

# PostgreSQL R2 Incremental Backup Script
# Uses pg_dump + restic for incremental backups to Cloudflare R2

BACKUP_DIR="/tmp/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="${BACKUP_DIR}/feel4_${TIMESTAMP}.sql"

echo "[$(date)] Starting PostgreSQL backup..."

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Initialize restic repository if not exists
if ! restic snapshots &>/dev/null; then
    echo "[$(date)] Initializing restic repository..."
    restic init || true
fi

# PostgreSQL dump
echo "[$(date)] Creating PostgreSQL dump..."
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "${POSTGRES_HOST:-postgres}" \
    -p "${POSTGRES_PORT:-5432}" \
    -U "${POSTGRES_USER:-postgres}" \
    -d "${POSTGRES_DB:-feel4}" \
    -F p \
    --no-owner \
    --no-acl \
    > "${DUMP_FILE}"

DUMP_SIZE=$(du -h "${DUMP_FILE}" | cut -f1)
echo "[$(date)] Dump created: ${DUMP_FILE} (${DUMP_SIZE})"

# Restic incremental backup to R2
echo "[$(date)] Uploading to R2 with restic..."
restic backup "${DUMP_FILE}" \
    --tag postgresql \
    --tag feel4 \
    --tag "${TIMESTAMP}"

# Cleanup local dump
rm -f "${DUMP_FILE}"

# Prune old backups (keep 7 daily, 4 weekly, 6 monthly)
echo "[$(date)] Pruning old backups..."
restic forget \
    --keep-daily 7 \
    --keep-weekly 4 \
    --keep-monthly 6 \
    --prune

# Verify backup integrity
echo "[$(date)] Verifying backup integrity..."
restic check --read-data-subset=1%

echo "[$(date)] Backup completed successfully!"

# Show recent snapshots
echo "[$(date)] Recent snapshots:"
restic snapshots --last 5
