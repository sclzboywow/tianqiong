/**
 * NPC 数据质检 + 沙盘地点 NPC 覆盖率校验。
 * 用法: npm run verify:npc-qa
 */
import {
  formatNpcDataQualityReport,
  runNpcDataQualityCheck,
} from "../src/game/npcDataQualityCheck";

function main() {
  const report = runNpcDataQualityCheck({ includeExcel: true });
  console.log(formatNpcDataQualityReport(report));

  if (!report.ok) {
    process.exit(1);
  }
}

main();
