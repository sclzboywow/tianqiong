#!/usr/bin/env bash
set -euo pipefail

DATA_DIR="/data/tianqiong"
BACKUP_DIR="${DATA_DIR}/backups"
RETENTION_DAYS=14
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "${BACKUP_DIR}"

backup_one() {
  local src="$1"
  local label="$2"

  if [[ ! -f "${src}" ]]; then
    echo "[skip] ${label} not found: ${src}"
    return 0
  fi

  local dest="${BACKUP_DIR}/${label}-${TIMESTAMP}.db"
  cp "${src}" "${dest}"
  echo "[ok] ${label} -> ${dest}"
}

backup_one "${DATA_DIR}/game.db" "game"
backup_one "${DATA_DIR}/payload.db" "payload"

find "${BACKUP_DIR}" -type f -name "*.db" -mtime +"${RETENTION_DAYS}" -delete 2>/dev/null || true
echo "[done] backups in ${BACKUP_DIR}, retention ${RETENTION_DAYS} days"
