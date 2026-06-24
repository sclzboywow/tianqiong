#!/usr/bin/env bash
# 在内测服 /opt/tianqiong 内执行：安装依赖、构建、重启 PM2（不拉代码）
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/tianqiong}"
PM2_NAME="${PM2_NAME:-tianqiong-internal-test}"

cd "${APP_DIR}"

if [[ ! -f .env ]]; then
  echo "!! 缺少 ${APP_DIR}/.env，请先复制 .env.production.example 并配置"
  exit 1
fi

echo "==> 安装依赖"
npm ci

echo "==> Typecheck"
npm run typecheck

echo "==> 构建"
npm run build

echo "==> 重启 PM2（单实例 fork）"
if pm2 describe "${PM2_NAME}" >/dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs --update-env
else
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo "==> 部署完成"
pm2 status "${PM2_NAME}"
