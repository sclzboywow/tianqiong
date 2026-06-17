# 《异界项目部：天穹综合体》

基于 Next.js 的多人文字建设模拟游戏 MVP。

## 技术栈

- Next.js + React + TypeScript
- Tailwind CSS + shadcn/ui
- Prisma + SQLite（游戏运行时）
- Payload CMS + SQLite（内容管理）
- Ink + inkjs（剧情）
- NapCat Mock 播报

## 快速开始

```bash
npm install
npm run db:push
npm run ink:compile
npm run seed
npm run dev
```

访问 http://localhost:3000

- 游戏前台：/
- 管理后台：/admin
- 注册：/register

## 环境变量

复制 `.env.example` 为 `.env` 并修改。

## NapCat 命令（Webhook）

POST `/api/napcat/webhook` body: `{ "message": "项目入口" }`

支持命令：项目入口、项目日报、项目排行

## 开发脚本

- `npm run ink:compile` - 生成并编译 Ink 剧情
- `npm run seed` - 初始化游戏数据与 Payload 内容
- `npm run db:push` - 同步 Prisma schema
- `npm run content:check` - 内容健康检查
- `npm run test:content-workflow` - 后台内容闭环 smoke 测试

详细运营流程见 [docs/content-ops-workflow.md](docs/content-ops-workflow.md)。

## Payload Schema 漂移

新增 StoryEntries、任务模板可视化效果字段等 collection 变更后，本地 `payload.db` 可能缺少表/列，导致 `/admin` 500 或 seed 失败。

**临时补齐 schema（仅本地开发）：**

```powershell
# PowerShell
$env:PAYLOAD_DB_PUSH="true"; npm run dev
```

启动后访问一次 http://localhost:3000/admin，确认 schema 推送完成，然后 **关闭 dev**，去掉 `PAYLOAD_DB_PUSH` 再正常启动：

```powershell
npm run dev
```

也可运行辅助脚本清理重复索引：

```bash
npx tsx --env-file=.env scripts/fix-payload-index-conflicts.ts
npx tsx --env-file=.env scripts/fix-payload-locked-documents-schema.ts
```

若 **admin 详情页空白**（任意 collection 的 `/admin/collections/.../id`），优先运行上面第二条脚本后重启 dev。

注意：

- 不要长期保持 `PAYLOAD_DB_PUSH=true`（默认 `payload.config.ts` 已关闭 push，避免重复 CREATE INDEX）
- 生产环境应使用 Payload 正式 migration，而非 dev push

## 后台 API 权限

- `POST /api/admin/seed`：需登录；仅 `GAME_ADMIN_USER_IDS` 中的用户（或开发环境首个注册用户）可执行；`overwrite=true` 同样需管理员
- `GET|POST /api/ops/story-preview/[slug]`：需登录，不可匿名访问剧情
