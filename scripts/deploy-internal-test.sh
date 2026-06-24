#!/usr/bin/env bash
# 天穹 v0.1 内测服一键部署（在服务器上执行；需能访问 GitHub）
# 若服务器无法 git clone GitHub，请用 scripts/sync-internal-test-bundle.sh（本机/CI）
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/sclzboywow/tianqiong.git}"
APP_DIR="/opt/tianqiong"
DATA_DIR="/data/tianqiong"
PM2_NAME="tianqiong-internal-test"

echo "==> 检查目录（不修改其它项目）"
sudo mkdir -p "${APP_DIR}" "${DATA_DIR}/backups"
if [[ ! -d "${APP_DIR}/.git" ]]; then
  echo "==> 首次克隆到 ${APP_DIR}"
  if ! sudo git clone "${REPO_URL}" "${APP_DIR}"; then
    echo "!! GitHub 克隆失败。请改用：bash scripts/sync-internal-test-bundle.sh"
    exit 1
  fi
  sudo chown -R "$(whoami):$(whoami)" "${APP_DIR}"
else
  echo "==> 更新代码 ${APP_DIR}"
  cd "${APP_DIR}"
  git fetch origin main
  git reset --hard origin/main
fi

cd "${APP_DIR}"

if [[ ! -f .env ]]; then
  echo "==> 从模板创建 .env（请随后编辑密钥与域名）"
  cp .env.production.example .env
  echo "!! 请编辑 ${APP_DIR}/.env：PAYLOAD_SECRET、SESSION_SECRET、NEXT_PUBLIC_SERVER_URL、GAME_ADMIN_USER_IDS"
fi

# 确保数据库路径指向数据目录
if ! grep -q 'file:/data/tianqiong/game.db' .env 2>/dev/null; then
  echo "!! 警告：.env 中 GAME_DATABASE_URL 应指向 file:/data/tianqiong/game.db"
fi
if ! grep -q 'file:/data/tianqiong/payload.db' .env 2>/dev/null; then
  echo "!! 警告：.env 中 DATABASE_URL 应指向 file:/data/tianqiong/payload.db"
fi

bash "${APP_DIR}/scripts/deploy-internal-test-remote.sh"

echo ""
echo "后续："
echo "  1. 确认 .env 域名与密钥：nano ${APP_DIR}/.env"
echo "  2. 配置 Nginx 反代 127.0.0.1:3000（见 docs/internal-test-deploy.md）"
echo "  3. 首次 seed（管理员配置好后）：cd ${APP_DIR} && npm run payload:seed:local"
echo "  4. 备份：${APP_DIR}/scripts/backup-sqlite.sh"
echo "  5. 无法直连 GitHub 时：在本机或 CI 使用 scripts/sync-internal-test-bundle.sh"
