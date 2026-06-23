# 天穹综合体 v0.1 内测服部署说明

## 内测服定位

v0.1 **测试服**，用于验证以下能力，不是正式上线环境：

- 用户注册与登录
- 项目进入与项目状态
- 任务大厅
- 协同地图 / 地点沙盘
- 后台配置与 Ops 编排台
- Payload CMS 后台（`/admin`）
- SQLite 数据落库
- 进程重启后数据是否保留

不引入新架构，不改核心玩法；仅补齐最小部署所需配置。

---

## 推荐目录

| 用途 | 路径 |
|------|------|
| 项目代码 | `/opt/tianqiong` |
| 数据库与备份 | `/data/tianqiong` |

```bash
sudo mkdir -p /opt/tianqiong /data/tianqiong/backups
sudo chown -R "$USER:$USER" /opt/tianqiong /data/tianqiong
```

---

## 服务器准备

在 Linux（建议 Ubuntu 22.04+）上安装：

```bash
sudo apt update
sudo apt install -y git curl nginx sqlite3

# Node.js 20+（示例：NodeSource）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2
sudo npm install -g pm2
```

### 4H4G 内存建议

内测机建议增加 **4G swap**，降低构建或突发内存占用导致 OOM 的风险：

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 部署流程（概要）

### 1. 拉取代码

```bash
cd /opt/tianqiong
git clone <你的仓库地址> .
```

### 2. 配置环境变量

```bash
cp .env.production.example .env
# 编辑 .env：域名、PAYLOAD_SECRET、SESSION_SECRET、GAME_ADMIN_USER_IDS 等
```

**数据库路径（必须放在数据目录，不要放源码目录）：**

```env
GAME_DATABASE_URL="file:/data/tianqiong/game.db"
DATABASE_URL="file:/data/tianqiong/payload.db"
```

**注意：**

- 生产 / 内测环境 **不要** 使用 `npm run dev`
- 使用 `npm run build` 构建，`npm run start` 或 PM2 启动
- **不要长期开启** `PAYLOAD_DB_PUSH=true`（仅本地开发临时补 schema 时使用）

### 3. 安装依赖与初始化

```bash
npm ci
npm run check:internal-test
npm run build
```

首次部署如需初始化游戏数据与 Payload 内容（在管理员账号配置好后）：

```bash
# 确保 .env 中 GAME_ADMIN_USER_IDS 已配置，且服务可访问
npm run payload:seed:local
# 或按需执行 npm run seed
```

### 4. PM2 启动（单实例）

当前项目使用 **SQLite**，并内置 **node-cron** 定时任务：

- **只能单实例运行**
- **禁止 cluster 模式**
- 多实例会导致 SQLite 写入冲突、定时任务重复执行

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # 按提示配置开机自启
```

常用命令：

```bash
pm2 status
pm2 logs tianqiong-internal-test
pm2 restart tianqiong-internal-test
```

### 5. Nginx 反代

最小示例（将 `your-domain.com` 换成你的域名或 IP）：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tianqiong /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

HTTPS 内测可按需用 certbot 或云厂商证书，本文不展开。

### 6. 定时备份（可选）

```bash
chmod +x scripts/backup-sqlite.sh
# crontab 示例：每天 03:00 备份
# 0 3 * * * /opt/tianqiong/scripts/backup-sqlite.sh >> /data/tianqiong/backups/backup.log 2>&1
```

---

## 内测验收清单

部署完成后逐项确认：

| 页面 / 能力 | 路径 | 预期 |
|-------------|------|------|
| 首页 | `/` | 可访问 |
| 注册 | `/register` | 可注册 / 登录 |
| 项目 | `/project` | 可进入项目 |
| 任务大厅 | `/tasks` | 任务列表正常 |
| 协同地图 | `/locations` | 地图 / 地点可打开 |
| Payload 后台 | `/admin` | 管理员可登录 |
| Ops 编排台 | `/ops/content-studio` | 已授权用户可访问 |
| 重启恢复 | `pm2 restart tianqiong-internal-test` | 用户、任务、Payload 数据仍在 |

额外建议：

```bash
npm run content:check
pm2 logs tianqiong-internal-test --lines 50
```

---

## 常见问题

**构建内存不足**  
确保 swap 已开启；构建时避免同时跑其他重负载进程。

**`/admin` 500**  
检查 `DATABASE_URL` 指向的 `payload.db` 是否存在、权限是否正确；不要在生产长期开 `PAYLOAD_DB_PUSH`。

**端口被占用**  
确认 `.env` 中 `PORT=3000` 与 Nginx `proxy_pass` 一致。

**数据丢失**  
确认数据库文件在 `/data/tianqiong/`，不在 `/opt/tianqiong` 源码目录内。
