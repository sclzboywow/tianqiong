import {
  runContentHealthCheckFromSqlite,
  type ContentHealthCheckReport,
} from "../src/game/contentHealthCheck";

function printReport(report: ContentHealthCheckReport) {
  if (report.missingCoreTables.length > 0) {
    console.error("\n=== 内容健康检查 ===\n");
    console.error(`[FAIL] 基础内容表缺失: ${report.missingCoreTables.join(", ")}`);
    console.error("       — 请先运行 npm run seed 或 POST /api/admin/seed 初始化 Payload 数据\n");
    process.exit(1);
  }

  console.log("\n=== 内容健康检查 ===\n");
  if (report.databaseUrl) {
    console.log(`数据库: ${report.databaseUrl}\n`);
  }

  for (const result of report.results) {
    if (result.pass) {
      console.log(`[PASS] ${result.name} (${result.total}/${result.total})`);
    } else {
      const passed = Math.max(0, result.total - result.failures.length);
      console.log(`[FAIL] ${result.name} (${passed}/${result.total})`);
      for (const failure of result.failures) {
        console.log(`       — ${failure}`);
      }
    }
  }

  for (const result of report.warnings || []) {
    console.log(`[WARN] ${result.name} (${result.failures.length}/${result.total})`);
    for (const failure of result.failures) {
      console.log(`       — ${failure}`);
    }
  }

  console.log(
    `\n合计: ${report.passCount} 通过, ${report.failCount} 失败` +
      (report.warnCount > 0 ? `, ${report.warnCount} 警告` : "") +
      "\n",
  );
}

async function main() {
  const report = await runContentHealthCheckFromSqlite();
  printReport(report);
  if (report.failCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("\n内容健康检查执行失败:", error instanceof Error ? error.message : error);
  console.error("请确认 DATABASE_URL 指向有效的 Payload SQLite 数据库，并已运行 seed。\n");
  process.exit(1);
});
