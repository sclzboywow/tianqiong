# 后台内容运营工作流

本文说明如何在 Payload 后台配置内容，并确保前台（协同地图、任务大厅、剧情预览）稳定生效。

## 1. 推荐配置顺序

1. **基础数据**（若尚未 seed）
   - 运行 `POST /api/admin/seed`（需登录且为管理员）
   - 或 `npm run dev` 后访问 `/admin` 手动维护

2. **StoryEntries（剧情入口）**
   - 在 `/admin` → Story Entries 创建条目
   - 填写 `slug`、`inkFile`（对应 `src/ink/stories/{inkFile}.ink`）
   - 编译剧情：`npm run ink:compile`

3. **TaskTemplates（任务模板）**
   - 配置 `storySlug` 关联 StoryEntry
   - 使用可视化字段配置成功/失败/选项/关键节点效果（优先于 JSON）
   - 设置 `stage`、`area`、`resolutionMode` 等

4. **EventTemplates（事件模板）**
   - 配置 `triggerLocationSlugs`、`triggerStage`、`riskTags`、`triggerAreaNames`、`triggerNpcNames`
   - 配置 `triggerTaskSlugs` 指向已存在的 TaskTemplate
   - 可选 `storySlug` 关联剧情

5. **LocationActions（地点行动）**
   - 绑定 `locationSlug`（map-locations）
   - 配置 `triggerTaskSlugs`、`storySlug`
   - 设置解锁阶段、消耗、门槛

6. **MapLocations / NPCs / Areas**
   - 确保地点 `relatedAreaNames`、`relatedNpcNames`、`riskTags` 与事件池筛选一致

7. **验证**
   - `npm run content:check` — 引用完整性
   - `npm run test:content-workflow` — 闭环 smoke
   - `/ops/content-studio` — 可视化关系与中文效果摘要
   - `/ops/story-preview/[slug]` — 剧情预览（需登录）

## 2. 内容关系

```
StoryEntry (slug, inkFile)
    ↑ storySlug
    ├── TaskTemplate ──→ 任务大厅 / 地点行动生成任务
    ├── EventTemplate ──→ 事件池（地点行动后加权触发）
    └── LocationAction（可选）

LocationAction
    ├── triggerTaskSlugs → TaskTemplate
    ├── locationSlug → MapLocation
    └── 执行后 → EventPoolEngine 按条件筛选 EventTemplate

TaskTemplate 效果
    ├── successMetricEffects / failMetricEffects（可视化，优先）
    ├── choiceEffectList / milestoneEffectList（可视化，优先）
    └── successEffects 等 JSON 字段（高级编辑 / 兼容回退）
```

**运行时读取顺序：**

- 任务效果：`taskTemplateEffectMapper.resolveTaskTemplateEffects` — 可视化字段优先，空则回退 JSON
- 剧情文件：`storySlug` → StoryEntry.inkFile，否则回退 TaskTemplate.inkFile
- 事件池：阶段 / 地点 / 里程碑 / 天数 / 冷却 + **riskTags / triggerAreaNames / triggerNpcNames** 与地点、行动标签求交集

## 3. 新增 Payload 字段后的 Schema 处理

Collection 变更（如 StoryEntries、任务可视化效果字段）后，本地 `payload.db` 可能缺表/缺列，表现为：

- `/admin` 500（`index already exists` 或缺列）
- seed / 预览报错

**临时补齐 schema（仅本地开发）：**

```powershell
$env:PAYLOAD_DB_PUSH="true"; npm run dev
```

访问 http://localhost:3000/admin 确认加载正常后，**停止 dev**，去掉环境变量再正常启动：

```powershell
npm run dev
```

若遇重复索引：

```bash
npx tsx --env-file=.env scripts/fix-payload-index-conflicts.ts
npx tsx --env-file=.env scripts/fix-payload-locked-documents-schema.ts
```

提示脚本：

```bash
npx tsx scripts/payload-schema-hint.ts
```

## 4. 为什么不要长期打开 PAYLOAD_DB_PUSH

`payload.config.ts` 默认 `push: process.env.PAYLOAD_DB_PUSH === "true"`。

- 每次 Payload 初始化可能重复 `CREATE INDEX`，与已有索引冲突导致 **admin 500**
- dev push 不适合生产；生产应使用 Payload 正式 migration
- 正常运营只需在 **schema 变更后临时 push 一次**，之后关闭

## 5. 为什么复杂嵌套字段不要直接 SQL migrate

任务可视化效果（`successMetricEffects`、`choiceEffectList` 等）在 SQLite 中对应 **多层子表**（如 `task_templates_choice_effect_list_metric_effects`）。

直接手写 SQL：

- 容易漏掉 `_parent_id`、`_order`、索引、外键
- 与 Payload/Drizzle 期望的表结构不一致
- 导致 health check 通过但 admin 保存失败，或反之

**推荐做法：**

1. 修改 `src/payload/collections/index.ts` 字段定义
2. `PAYLOAD_DB_PUSH=true` 启动 dev 让 Payload 创建/变更表
3. 需要回填静态数据时用 `POST /api/admin/seed?overwrite=true`（管理员）或专用 sync 脚本（如 `sync-story-entries.ts`）
4. 避免对嵌套 array 子表做 `INSERT` 除非脚本已对齐 Payload 的 id / 外键约定

## 6. API 权限摘要

| 接口 | 要求 |
|------|------|
| `POST /api/admin/seed` | 登录 + 管理员；`overwrite=true` 同样需管理员 |
| `GET/POST /api/ops/story-preview/[slug]` | 登录 |

管理员判定：`GAME_ADMIN_USER_IDS`（逗号分隔用户 ID）；开发环境未配置时，**首个注册用户**视为管理员。

## 7. 常用命令

```bash
npm run content:check              # 内容健康检查
npm run test:content-workflow      # 后台闭环 smoke
npm run test:locations             # 协同地图 smoke
npm run ink:compile                # 编译 Ink
```
