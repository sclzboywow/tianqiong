#!/usr/bin/env bash
# 从本机或 CI 将 main 分支 bundle 同步到内测服并远程构建重启
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/tianqiong}"
BUNDLE_PATH="${BUNDLE_PATH:-/tmp/tianqiong.bundle}"
SSH_HOST="${INTERNAL_TEST_SSH_HOST:?请设置 INTERNAL_TEST_SSH_HOST}"
SSH_USER="${INTERNAL_TEST_SSH_USER:-ubuntu}"
SSH_PORT="${INTERNAL_TEST_SSH_PORT:-22}"
GIT_REF="${GIT_REF:-main}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "${INTERNAL_TEST_SSH_KEY:-}" && -z "${SSH_IDENTITY_FILE:-}" ]]; then
  echo "!! 请设置 INTERNAL_TEST_SSH_KEY（私钥内容）或 SSH_IDENTITY_FILE（私钥路径）"
  exit 1
fi

SSH_OPTS=(-p "${SSH_PORT}" -o StrictHostKeyChecking=accept-new)
SCP_OPTS=(-P "${SSH_PORT}" -o StrictHostKeyChecking=accept-new)
KEY_FILE=""

cleanup() {
  if [[ -n "${KEY_FILE}" && -f "${KEY_FILE}" ]]; then
    rm -f "${KEY_FILE}"
  fi
  if [[ -n "${LOCAL_BUNDLE:-}" && -f "${LOCAL_BUNDLE}" ]]; then
    rm -f "${LOCAL_BUNDLE}"
  fi
}
trap cleanup EXIT

if [[ -n "${INTERNAL_TEST_SSH_KEY:-}" ]]; then
  KEY_FILE="$(mktemp)"
  printf '%s\n' "${INTERNAL_TEST_SSH_KEY}" > "${KEY_FILE}"
  chmod 600 "${KEY_FILE}"
  SSH_OPTS+=(-i "${KEY_FILE}")
  SCP_OPTS+=(-i "${KEY_FILE}")
elif [[ -n "${SSH_IDENTITY_FILE:-}" ]]; then
  SSH_OPTS+=(-i "${SSH_IDENTITY_FILE}")
  SCP_OPTS+=(-i "${SSH_IDENTITY_FILE}")
fi

LOCAL_BUNDLE="$(mktemp /tmp/tianqiong.XXXXXX.bundle)"
echo "==> 打包 ${GIT_REF} -> ${LOCAL_BUNDLE}"
git -C "${REPO_ROOT}" bundle create "${LOCAL_BUNDLE}" "${GIT_REF}"

echo "==> 上传 bundle -> ${SSH_USER}@${SSH_HOST}:${BUNDLE_PATH}"
scp "${SCP_OPTS[@]}" "${LOCAL_BUNDLE}" "${SSH_USER}@${SSH_HOST}:${BUNDLE_PATH}"

echo "==> 远程更新代码并部署"
ssh "${SSH_OPTS[@]}" "${SSH_USER}@${SSH_HOST}" bash -s <<EOF
set -euo pipefail
APP_DIR="${APP_DIR}"
BUNDLE_PATH="${BUNDLE_PATH}"

sudo mkdir -p "\${APP_DIR}"
if [[ ! -d "\${APP_DIR}/.git" ]]; then
  sudo mkdir -p "\${APP_DIR}"
  sudo chown -R "\$(whoami):\$(whoami)" "\${APP_DIR}"
  git clone "\${BUNDLE_PATH}" "\${APP_DIR}"
  cd "\${APP_DIR}"
  git remote set-url origin "\${BUNDLE_PATH}"
else
  cd "\${APP_DIR}"
  git remote set-url origin "\${BUNDLE_PATH}" 2>/dev/null || git remote add origin "\${BUNDLE_PATH}"
  git fetch origin
  git reset --hard origin/main
fi

bash "\${APP_DIR}/scripts/deploy-internal-test-remote.sh"
EOF

echo "==> 内测服同步完成"
