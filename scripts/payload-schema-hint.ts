/**
 * 提示 Payload schema 漂移处理方式
 * 运行：npx tsx scripts/payload-schema-hint.ts
 */
console.log(`
=== Payload Schema 漂移处理 ===

新增 StoryEntries / 任务可视化效果字段后，若 /admin 500 或 seed 报错：

1. 临时推送 schema（PowerShell）：
   $env:PAYLOAD_DB_PUSH="true"; npm run dev

2. 访问 http://localhost:3000/admin 确认加载正常

3. 停止 dev，去掉 PAYLOAD_DB_PUSH，再正常启动：
   npm run dev

4. 若报 index already exists：
   npx tsx --env-file=.env scripts/fix-payload-index-conflicts.ts

注意：不要长期保持 PAYLOAD_DB_PUSH=true
详见 README.md「Payload Schema 漂移」
`);
