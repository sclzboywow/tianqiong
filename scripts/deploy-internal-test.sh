#!/usr/bin/env bash
# 天穹 v0.1 内测服一键部署（仅操作 /opt/tianqiong 与 /data/tianqiong）
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/sclzboywow/tianqiong.git}"
APP_DIR="/opt/tianqiong"
DATA_DIR="/data/tianqiong"
PM2_NAME="tianqiong-internal-test"

echo "==> 检查目录（不修改其它项目）"
sudo mkdir -p "${APP_DIR}" "${DATA_DIR}/backups"
if [[ ! -d "${APP_DIR}/.git" ]]; then
  echo "==> 首次克隆到 ${APP_DIR}"
  sudo git clone "${REPO_URL}" "${APP_DIR}"
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

echo "==> 安装依赖"
npm ci

echo "==> 内测检查（typecheck + content）"
npm run typecheck
npm run content:check

echo "==> 构建"
npm run build

echo "==> PM2 启动（单实例 fork）"
if pm2 describe "${PM2_NAME}" >/dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo ""
echo "==> 部署完成"
pm2 status "${PM2_NAME}"
echo ""
echo "后续："
echo "  1. 确认 .env 域名与密钥：nano ${APP_DIR}/.env"
echo "  2. 配置 Nginx 反代 127.0.0.1:3000（见 docs/internal-test-deploy.md）"
echo "  3. 首次 seed（管理员配置好后）：cd ${APP_DIR} && npm run payload:seed:local"
echo "  4. 备份：${APP_DIR}/scripts/backup-sqlite.sh"
