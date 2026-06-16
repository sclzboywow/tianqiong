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
