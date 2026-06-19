import path from "node:path";
import fs from "node:fs";
import { MAP_LOCATIONS } from "@/data/locations";
import { LOCATION_SANDTABLE_AREAS } from "@/data/locationSandtableAreas";
import { MAP_LOCATION_SANDTABLE_PLACEMENT } from "@/data/mapLocationSandtable";
import {
  LOCATION_NPC_ASSIGNMENTS,
} from "@/data/locationNpcAssignments";
import {
  getNpcProfileById,
  LEGACY_NPC_NAME_ALIASES,
  NPC_PROFILES,
  type NpcLevel,
} from "@/data/npcProfiles";
import { REGION_NPC_DEFAULTS } from "@/data/regionNpcDefaults";
import { getOrganizationPayload, listKnownOrganizations } from "@/lib/npcOrganizationPayload";
import type { LocationRegionId } from "@/game/locationSandtablePresentationEngine";
import { buildSandtableNpcRefs } from "@/game/sandtableNpcResolver";

export type NpcQaSeverity = "error" | "warn";

export type NpcQaIssue = {
  severity: NpcQaSeverity;
  code: string;
  message: string;
};

export type SandtableNodeCoverage = {
  locationId: string;
  name: string;
  regionId: LocationRegionId;
  source: "real" | "synthetic";
  assignmentCount: number;
  npcCount: number;
  coverage: "assigned" | "region_default" | "legacy_fallback" | "empty";
  npcNames: string[];
};

export type RegionCoverageSummary = {
  regionId: LocationRegionId;
  total: number;
  assigned: number;
  regionDefault: number;
  legacyFallback: number;
  empty: number;
};

export type NpcDataQualityReport = {
  ok: boolean;
  errorCount: number;
  warnCount: number;
  issues: NpcQaIssue[];
  profileCount: number;
  assignmentCount: number;
  sandtableNodeCount: number;
  regionSummaries: RegionCoverageSummary[];
  emptyNodes: SandtableNodeCoverage[];
  defaultOnlyNodes: SandtableNodeCoverage[];
  legacyFallbackNodes: SandtableNodeCoverage[];
};

const VALID_LEVELS = new Set<NpcLevel>(["S", "A", "B", "C"]);
const KNOWN_ORGS = new Set(listKnownOrganizations());

function issue(severity: NpcQaSeverity, code: string, message: string): NpcQaIssue {
  return { severity, code, message };
}

function collectSandtableNodes(): Array<{
  locationId: string;
  name: string;
  regionId: LocationRegionId;
  zoneId: string;
  source: "real" | "synthetic";
  fallbackNpcNames?: string[];
}> {
  const realLocationIds = new Set(MAP_LOCATIONS.map((loc) => loc.id));
  const nodes: Array<{
    locationId: string;
    name: string;
    regionId: LocationRegionId;
    zoneId: string;
    source: "real" | "synthetic";
    fallbackNpcNames?: string[];
  }> = [];

  for (const location of MAP_LOCATIONS) {
    const placement =
      MAP_LOCATION_SANDTABLE_PLACEMENT[location.id] ??
      ({ regionId: "command_center", zoneId: "command_meeting" } as const);
    nodes.push({
      locationId: location.id,
      name: location.name,
      regionId: placement.regionId,
      zoneId: placement.zoneId,
      source: "real",
      fallbackNpcNames: location.relatedNpcNames,
    });
  }

  for (const area of LOCATION_SANDTABLE_AREAS) {
    const linked = area.relatedLocationSlugs ?? [];
    if (linked.length > 0 && linked.some((slug) => realLocationIds.has(slug))) {
      continue;
    }
    nodes.push({
      locationId: area.id,
      name: area.name,
      regionId: area.regionId,
      zoneId: area.zoneId,
      source: "synthetic",
    });
  }

  return nodes;
}

function checkProfiles(issues: NpcQaIssue[]) {
  const idSet = new Set<string>();
  const excelIdSet = new Set<string>();

  for (const profile of NPC_PROFILES) {
    if (idSet.has(profile.id)) {
      issues.push(issue("error", "profile.duplicate_id", `重复 profile id: ${profile.id}`));
    }
    idSet.add(profile.id);

    if (excelIdSet.has(profile.excelId)) {
      issues.push(
        issue("error", "profile.duplicate_excel_id", `重复 excelId: ${profile.excelId}`),
      );
    }
    excelIdSet.add(profile.excelId);

    if (!VALID_LEVELS.has(profile.level)) {
      issues.push(
        issue("error", "profile.invalid_level", `${profile.excelId} 等级无效: ${profile.level}`),
      );
    }

    for (const field of ["name", "title", "organization", "description"] as const) {
      if (!profile[field]?.trim()) {
        issues.push(
          issue("error", "profile.missing_field", `${profile.excelId} 缺少 ${field}`),
        );
      }
    }

    if (!KNOWN_ORGS.has(profile.organization)) {
      issues.push(
        issue(
          "warn",
          "profile.unknown_organization",
          `${profile.excelId} ${profile.name} 单位未映射: ${profile.organization}`,
        ),
      );
    }

    const expected = getOrganizationPayload(profile.organization);
    if (profile.payloadCategory !== expected.category) {
      issues.push(
        issue(
          "error",
          "profile.category_mismatch",
          `${profile.excelId} payloadCategory 应为 ${expected.category}，现为 ${profile.payloadCategory}`,
        ),
      );
    }
    if (profile.payloadType !== expected.type) {
      issues.push(
        issue(
          "error",
          "profile.type_mismatch",
          `${profile.excelId} payloadType 应为 ${expected.type}，现为 ${profile.payloadType}`,
        ),
      );
    }
  }
}

function checkAssignments(issues: NpcQaIssue[]) {
  const validLocationIds = new Set([
    ...MAP_LOCATIONS.map((loc) => loc.id),
    ...LOCATION_SANDTABLE_AREAS.map((area) => area.id),
  ]);
  const pairSet = new Set<string>();

  for (const row of LOCATION_NPC_ASSIGNMENTS) {
    if (!getNpcProfileById(row.npcId)) {
      issues.push(
        issue(
          "error",
          "assignment.unknown_npc",
          `挂载 ${row.locationId} → 未知 npcId: ${row.npcId}`,
        ),
      );
    }

    if (!validLocationIds.has(row.locationId)) {
      issues.push(
        issue(
          "error",
          "assignment.unknown_location",
          `未知 locationId: ${row.locationId} (npcId=${row.npcId})`,
        ),
      );
    }

    const pairKey = `${row.locationId}::${row.npcId}::${row.role}`;
    if (pairSet.has(pairKey)) {
      issues.push(
        issue("warn", "assignment.duplicate", `重复挂载: ${row.locationId} ${row.npcId} ${row.role}`),
      );
    }
    pairSet.add(pairKey);
  }
}

function checkRegionDefaults(issues: NpcQaIssue[]) {
  for (const row of REGION_NPC_DEFAULTS) {
    for (const npcId of row.npcIds) {
      if (!getNpcProfileById(npcId)) {
        issues.push(
          issue(
            "error",
            "region_default.unknown_npc",
            `区域 ${row.regionId} 默认 NPC 不存在: ${npcId}`,
          ),
        );
      }
    }
  }
}

function checkLegacyAliases(issues: NpcQaIssue[]) {
  for (const [legacyName, profileId] of Object.entries(LEGACY_NPC_NAME_ALIASES)) {
    if (!getNpcProfileById(profileId)) {
      issues.push(
        issue(
          "error",
          "legacy.alias_broken",
          `LEGACY 别名「${legacyName}」→ 不存在 profile: ${profileId}`,
        ),
      );
    }
  }
}

function classifyCoverage(
  locationId: string,
  regionId: LocationRegionId,
  zoneId: string,
  fallbackNpcNames: string[] | undefined,
): Pick<SandtableNodeCoverage, "assignmentCount" | "npcCount" | "coverage" | "npcNames"> {
  const assignments = LOCATION_NPC_ASSIGNMENTS.filter((a) => a.locationId === locationId);
  const result = buildSandtableNpcRefs({
    locationId,
    regionId,
    zoneId,
    fallbackNpcNames,
  });

  let coverage: SandtableNodeCoverage["coverage"] = "empty";
  if (result.relatedNpcs.length === 0) {
    coverage = "empty";
  } else if (assignments.length > 0) {
    coverage = "assigned";
  } else if (
    fallbackNpcNames?.length &&
    result.relatedNpcs.some((npc) => npc.npcId.startsWith("legacy_"))
  ) {
    coverage = "legacy_fallback";
  } else {
    coverage = "region_default";
  }

  return {
    assignmentCount: assignments.length,
    npcCount: result.relatedNpcs.length,
    coverage,
    npcNames: result.relatedNpcNames,
  };
}

function checkSandtableCoverage(issues: NpcQaIssue[]): {
  nodes: SandtableNodeCoverage[];
  regionSummaries: RegionCoverageSummary[];
  emptyNodes: SandtableNodeCoverage[];
  defaultOnlyNodes: SandtableNodeCoverage[];
  legacyFallbackNodes: SandtableNodeCoverage[];
} {
  const nodes: SandtableNodeCoverage[] = collectSandtableNodes().map((node) => {
    const classified = classifyCoverage(
      node.locationId,
      node.regionId,
      node.zoneId,
      node.fallbackNpcNames,
    );
    return {
      locationId: node.locationId,
      name: node.name,
      regionId: node.regionId,
      source: node.source,
      ...classified,
    };
  });

  const regionSummaries: RegionCoverageSummary[] = [];
  const regionIds: LocationRegionId[] = [
    "owner_hub",
    "command_center",
    "approval_regulatory",
    "professional_service",
    "construction_site",
    "opening_prep",
  ];

  for (const regionId of regionIds) {
    const regionNodes = nodes.filter((node) => node.regionId === regionId);
    regionSummaries.push({
      regionId,
      total: regionNodes.length,
      assigned: regionNodes.filter((n) => n.coverage === "assigned").length,
      regionDefault: regionNodes.filter((n) => n.coverage === "region_default").length,
      legacyFallback: regionNodes.filter((n) => n.coverage === "legacy_fallback").length,
      empty: regionNodes.filter((n) => n.coverage === "empty").length,
    });
  }

  const emptyNodes = nodes.filter((node) => node.coverage === "empty");
  const defaultOnlyNodes = nodes.filter((node) => node.coverage === "region_default");
  const legacyFallbackNodes = nodes.filter((node) => node.coverage === "legacy_fallback");

  for (const node of emptyNodes) {
    issues.push(
      issue(
        "error",
        "coverage.empty",
        `地点无 NPC: ${node.locationId} (${node.name}) [${node.regionId}]`,
      ),
    );
  }

  for (const node of legacyFallbackNodes) {
    issues.push(
      issue(
        "warn",
        "coverage.legacy_fallback",
        `仅 legacy 兜底 NPC: ${node.locationId} (${node.name}) → ${node.npcNames.join("、")}`,
      ),
    );
  }

  for (const summary of regionSummaries) {
    if (summary.total > 0 && summary.assigned === 0) {
      issues.push(
        issue(
          "warn",
          "coverage.region_no_assignment",
          `区域 ${summary.regionId} 无任何专属挂载（全部走区域默认）`,
        ),
      );
    }
    const assignedRate = summary.assigned / summary.total;
    if (summary.total >= 5 && assignedRate < 0.5) {
      issues.push(
        issue(
          "warn",
          "coverage.region_low_assignment_rate",
          `区域 ${summary.regionId} 专属挂载率偏低: ${summary.assigned}/${summary.total} (${Math.round(assignedRate * 100)}%)`,
        ),
      );
    }
  }

  return { nodes, regionSummaries, emptyNodes, defaultOnlyNodes, legacyFallbackNodes };
}

function checkExcelAssignments(issues: NpcQaIssue[]) {
  const xlsxPath = path.join(process.cwd(), "天穹_分区沙盘NPC分级配置表.xlsx");
  if (!fs.existsSync(xlsxPath)) {
    issues.push(
      issue("warn", "excel.missing", "未找到 Excel 策划表，跳过 NPC配置总表 交叉校验"),
    );
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const XLSX = require("xlsx") as typeof import("xlsx");
    const wb = XLSX.readFile(xlsxPath);
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets["NPC配置总表"], {
      defval: "",
    });
    if (rows.length !== LOCATION_NPC_ASSIGNMENTS.length) {
      issues.push(
        issue(
          "warn",
          "excel.assignment_count",
          `挂载数量: Excel ${rows.length} vs TS ${LOCATION_NPC_ASSIGNMENTS.length}`,
        ),
      );
    }
  } catch (error) {
    issues.push(
      issue(
        "warn",
        "excel.read_failed",
        `读取 Excel 失败: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}

export function runNpcDataQualityCheck(options?: {
  includeExcel?: boolean;
}): NpcDataQualityReport {
  const issues: NpcQaIssue[] = [];

  checkProfiles(issues);
  checkAssignments(issues);
  checkRegionDefaults(issues);
  checkLegacyAliases(issues);
  if (options?.includeExcel !== false) {
    checkExcelAssignments(issues);
  }
  const coverage = checkSandtableCoverage(issues);

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warnCount = issues.filter((i) => i.severity === "warn").length;

  return {
    ok: errorCount === 0,
    errorCount,
    warnCount,
    issues,
    profileCount: NPC_PROFILES.length,
    assignmentCount: LOCATION_NPC_ASSIGNMENTS.length,
    sandtableNodeCount: coverage.nodes.length,
    regionSummaries: coverage.regionSummaries,
    emptyNodes: coverage.emptyNodes,
    defaultOnlyNodes: coverage.defaultOnlyNodes,
    legacyFallbackNodes: coverage.legacyFallbackNodes,
  };
}

export function formatNpcDataQualityReport(report: NpcDataQualityReport): string {
  const lines: string[] = ["=== NPC 数据质检与地点覆盖率 ===", ""];

  lines.push(
    `角色库: ${report.profileCount} | 挂载: ${report.assignmentCount} | 沙盘节点: ${report.sandtableNodeCount}`,
  );
  lines.push("");

  lines.push("--- 六大区覆盖率 ---");
  for (const row of report.regionSummaries) {
    lines.push(
      `${row.regionId}: 专属 ${row.assigned}/${row.total}, 区域默认 ${row.regionDefault}, legacy ${row.legacyFallback}, 空 ${row.empty}`,
    );
  }
  lines.push("");

  const errors = report.issues.filter((i) => i.severity === "error");
  const warns = report.issues.filter((i) => i.severity === "warn");

  if (errors.length > 0) {
    lines.push(`--- 错误 (${errors.length}) ---`);
    for (const row of errors.slice(0, 40)) {
      lines.push(`[ERROR] ${row.code}: ${row.message}`);
    }
    if (errors.length > 40) lines.push(`... 另有 ${errors.length - 40} 项错误`);
    lines.push("");
  }

  if (warns.length > 0) {
    lines.push(`--- 警告 (${warns.length}) ---`);
    for (const row of warns.slice(0, 20)) {
      lines.push(`[WARN] ${row.code}: ${row.message}`);
    }
    if (warns.length > 20) lines.push(`... 另有 ${warns.length - 20} 项警告`);
    lines.push("");
  }

  lines.push(
    `合计: ${errors.length} 错误, ${warns.length} 警告 — ${report.ok ? "通过" : "未通过"}`,
  );

  return lines.join("\n");
}
