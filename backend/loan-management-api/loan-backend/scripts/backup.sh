#!/bin/sh
# Automated PostgreSQL backup
# Runs daily at 02:00 UTC via cron

BACKUP_DIR="/backups"
DB_HOST="db"
DB_PORT="5432"
DB_NAME="loan_saas_db"
DB_USER="${DB_USERNAME:-postgres}"
RETENTION_DAYS=30
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/loansaas_$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"
echo "[BACKUP] Starting at $(date)"

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
    echo "[BACKUP] Success: $BACKUP_FILE ($SIZE)"
else
    echo "[BACKUP] FAILED at $(date)" >&2
    exit 1
fi

# Delete backups older than 30 days
find "$BACKUP_DIR" -name "loansaas_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "[BACKUP] Cleaned up backups older than $RETENTION_DAYS days"

# List recent backups
echo "[BACKUP] Current backups:"
ls -lh "$BACKUP_DIR"/loansaas_*.sql.gz 2>/dev/null | tail -5