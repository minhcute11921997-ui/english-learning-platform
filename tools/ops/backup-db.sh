#!/usr/bin/env bash
set -euo pipefail

# Script sao lưu cơ sở dữ liệu MySQL cho EngLearn (hỗ trợ cả Docker container và host)
BACKUP_DIR="${BACKUP_DIR:-./backups/mysql}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
CONTAINER_NAME="${MYSQL_CONTAINER:-englearn_mysql}"
DB_NAME="${DB_NAME:-english_learning}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${MYSQL_ROOT_PASSWORD:-${DB_PASSWORD:-}}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "${CONTAINER_NAME}"; then
  echo "Đang sao lưu từ Docker container '${CONTAINER_NAME}'..."
  docker exec "${CONTAINER_NAME}" mysqldump \
    -u"${DB_USER}" -p"${DB_PASSWORD}" \
    --single-transaction --routines --triggers --databases "${DB_NAME}" \
    | gzip -9 > "${OUT_FILE}"
else
  echo "Đang sao lưu trực tiếp từ MySQL host (${DB_HOST:-127.0.0.1}:${DB_PORT:-3306})..."
  mysqldump \
    -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" \
    -u"${DB_USER}" -p"${DB_PASSWORD}" \
    --single-transaction --routines --triggers --databases "${DB_NAME}" \
    | gzip -9 > "${OUT_FILE}"
fi

echo "Đã tạo bản sao lưu: ${OUT_FILE}"

# Xoay vòng: xóa các bản sao lưu cũ hơn RETENTION_DAYS ngày
find "${BACKUP_DIR}" -type f -name "${DB_NAME}_*.sql.gz" -mtime +"${RETENTION_DAYS}" -delete
echo "Đã dọn các bản sao lưu cũ hơn ${RETENTION_DAYS} ngày."
