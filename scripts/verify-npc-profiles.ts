/**
 * 对照 Excel 角色库校验 npcProfiles.ts 是否完整一致。
 * 用法: npm run verify:npcs
 */
import path from "node:path";
import XLSX from "xlsx";
import { NPC_PROFILES } from "../src/data/npcProfiles";
import { getOrganizationPayload } from "../src/lib/npcOrganizationPayload";

const XLSX_PATH = path.join(process.cwd(), "天穹_分区沙盘NPC分级配置表.xlsx");

const REGION_MAP: Record<string, string> = {
  业主: "owner_hub",
  业主中枢: "owner_hub",
  现场指挥区: "command_center",
  审批监管区: "approval_regulatory",
  专业服务区: "professional_service",
  施工现场: "construction_site",
  开业筹备: "opening_prep",
  开业筹备区: "opening_prep",
};

function splitList(value: string): string[] {
  return (value || "")
    .split(/[、,，/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function main() {
  const wb = XLSX.readFile(XLSX_PATH);
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets["NPC角色库"], {
    defval: "",
  });

  const profileByExcelId = new Map(NPC_PROFILES.map((profile) => [profile.excelId, profile]));
  const errors: string[] = [];

  if (rows.length !== NPC_PROFILES.length) {
    errors.push(`数量不一致: Excel ${rows.length} vs TS ${NPC_PROFILES.length}`);
  }

  for (const row of rows) {
    const excelId = row.NPC_ID;
    const profile = profileByExcelId.get(excelId);
    if (!profile) {
      errors.push(`${excelId}: TS 中缺失`);
      continue;
    }

    const orgPayload = getOrganizationPayload(row["所属阵营/单位"]);
    const expectedRegion = REGION_MAP[row["常驻大区"]];
    const expectedHelps = splitList(row["可推动任务"]);
    const expectedBlocks = splitList(row["可能制造阻力"]);
    const expectedTaskFunction = row["任务功能"] || row["核心诉求"] || row["职务/身份"];

    const checks: [string, string, string][] = [
      ["姓名", row["NPC姓名"], profile.name],
      ["职衔", row["职务/身份"], profile.title],
      ["单位", row["所属阵营/单位"], profile.organization],
      ["等级", row["基础等级"], profile.level],
      ["常驻大区", row["常驻大区"], profile.residentRegion],
      ["性格", row["性格/立场"], profile.personality || ""],
      ["诉求", row["核心诉求"], profile.agenda || ""],
      ["任务功能", expectedTaskFunction, profile.description],
      ["category", orgPayload.category, profile.payloadCategory],
      ["type", orgPayload.type, profile.payloadType],
    ];

    for (const [label, expected, actual] of checks) {
      if (expected !== actual) {
        errors.push(`${excelId} ${profile.name} ${label}: Excel「${expected}」≠ TS「${actual}」`);
      }
    }

    if (expectedRegion && profile.sandtableRegionId !== expectedRegion) {
      errors.push(
        `${excelId} ${profile.name} sandtableRegionId: Excel「${expectedRegion}」≠ TS「${profile.sandtableRegionId}」`,
      );
    }

    if (JSON.stringify(expectedHelps) !== JSON.stringify(profile.helpsWith || [])) {
      errors.push(`${excelId} ${profile.name} helpsWith 不一致`);
    }
    if (JSON.stringify(expectedBlocks) !== JSON.stringify(profile.blocksWhen || [])) {
      errors.push(`${excelId} ${profile.name} blocksWhen 不一致`);
    }
  }

  const orphanProfiles = NPC_PROFILES.filter(
    (profile) => !rows.some((row) => row.NPC_ID === profile.excelId),
  );
  for (const profile of orphanProfiles) {
    errors.push(`TS 多余 profile: ${profile.excelId} ${profile.name}`);
  }

  if (errors.length > 0) {
    console.error(`NPC 校验失败 (${errors.length} 项):`);
    for (const error of errors.slice(0, 30)) {
      console.error(`- ${error}`);
    }
    if (errors.length > 30) {
      console.error(`... 另有 ${errors.length - 30} 项`);
    }
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        total: rows.length,
        message: "Excel 与 npcProfiles.ts 完全一致",
      },
      null,
      2,
    ),
  );
}

main();
