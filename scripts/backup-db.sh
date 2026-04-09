#!/usr/bin/env bash
# ============================================================
#  Anytokens PostgreSQL 自动备份脚本
#  用法：bash /opt/anytokens/scripts/backup-db.sh
#  Cron：0 2 * * * /opt/anytokens/scripts/backup-db.sh
# ============================================================
set -euo pipefail

BACKUP_DIR="/opt/backups/anytokens"
RETENTION_DAYS=7
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="${BACKUP_DIR}/anytokens_${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# 从 .env.production 读取数据库凭据
ENV_FILE="/opt/anytokens/.env.production"
PG_USER=$(grep -oP 'POSTGRES_USER=\K.*' "$ENV_FILE" 2>/dev/null || echo "anytokens")
PG_PASSWORD=$(grep -oP 'POSTGRES_PASSWORD=\K.*' "$ENV_FILE" 2>/dev/null || echo "")
PG_DB=$(grep -oP 'POSTGRES_DB=\K.*' "$ENV_FILE" 2>/dev/null || echo "anytokens")

# 通知邮件配置（使用 Resend API，复用现有配置）
RESEND_API_KEY=$(grep -oP 'RESEND_API_KEY=\K.*' "$ENV_FILE" 2>/dev/null || echo "")
ADMIN_EMAIL=$(grep -oP 'ADMIN_EMAIL=\K.*' "$ENV_FILE" 2>/dev/null || echo "")

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

send_alert() {
  local subject="$1" body="$2"
  if [[ -n "$RESEND_API_KEY" && -n "$ADMIN_EMAIL" ]]; then
    curl -sS -X POST 'https://api.resend.com/emails' \
      -H "Authorization: Bearer $RESEND_API_KEY" \
      -H 'Content-Type: application/json' \
      -d "{\"from\":\"Anytokens <noreply@anytokens.net>\",\"to\":[\"$ADMIN_EMAIL\"],\"subject\":\"$subject\",\"text\":\"$body\"}" \
      > /dev/null 2>&1 || true
  fi
}

# 确保备份目录存在
mkdir -p "$BACKUP_DIR"

log "开始备份..."

# 执行 pg_dump（通过 Docker 容器）
if docker exec anytokens-postgres-1 pg_dump \
  -U "$PG_USER" \
  -d "$PG_DB" \
  --no-owner \
  --no-privileges \
  2>>"$LOG_FILE" | gzip > "$BACKUP_FILE"; then

  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  log "备份成功: $BACKUP_FILE ($SIZE)"

  # 清理过期备份
  DELETED=$(find "$BACKUP_DIR" -name "anytokens_*.sql.gz" -mtime +$RETENTION_DAYS -delete -print | wc -l)
  if [[ "$DELETED" -gt 0 ]]; then
    log "已清理 $DELETED 个过期备份"
  fi

  log "备份完成"
else
  log "备份失败!"
  send_alert \
    "[Anytokens] 数据库备份失败" \
    "时间: $(date)\n服务器: $(hostname)\n备份文件: $BACKUP_FILE\n\n请立即检查数据库状态。"
  exit 1
fi
