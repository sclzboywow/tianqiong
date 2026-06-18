import type { NpcFaction } from "@/data/npcProfiles";

export type OrganizationPayloadMeta = {
  category: string;
  type: string;
  faction: NpcFaction;
};

/** 按 Excel「所属阵营/单位」映射 Payload category / type / faction（勿用 faction 反推 type） */
const ORGANIZATION_PAYLOAD: Record<string, OrganizationPayloadMeta> = {
  业主方: { category: "owner_regulator", type: "owner", faction: "owner" },
  "业主/运营": { category: "operation", type: "owner", faction: "owner" },
  总包单位: { category: "construction", type: "contractor", faction: "contractor" },
  总包生产: { category: "construction", type: "contractor", faction: "contractor" },
  总包机电: { category: "construction", type: "contractor", faction: "contractor" },
  总包安全: { category: "construction", type: "contractor", faction: "contractor" },
  总包材料: { category: "construction", type: "contractor", faction: "contractor" },
  总包设备: { category: "construction", type: "contractor", faction: "contractor" },
  总包后勤: { category: "construction", type: "contractor", faction: "contractor" },
  监理单位: { category: "owner_regulator", type: "supervisor", faction: "supervisor" },
  班组: { category: "construction", type: "subcontractor", faction: "labor" },
  机电分包: { category: "construction", type: "subcontractor", faction: "labor" },
  幕墙分包: { category: "construction", type: "subcontractor", faction: "labor" },
  精装分包: { category: "construction", type: "subcontractor", faction: "labor" },
  后勤分包: { category: "construction", type: "subcontractor", faction: "labor" },
  "机电/消防分包": { category: "construction", type: "subcontractor", faction: "labor" },
  暖通分包: { category: "construction", type: "subcontractor", faction: "labor" },
  市政分包: { category: "construction", type: "subcontractor", faction: "labor" },
  景观分包: { category: "construction", type: "subcontractor", faction: "labor" },
  政务服务中心: { category: "owner_regulator", type: "regulator", faction: "government" },
  发改窗口: { category: "owner_regulator", type: "regulator", faction: "government" },
  自然资源和规划局: { category: "owner_regulator", type: "regulator", faction: "government" },
  住建局: { category: "owner_regulator", type: "regulator", faction: "government" },
  质量安全监督站: { category: "owner_regulator", type: "regulator", faction: "government" },
  消防审查窗口: { category: "owner_regulator", type: "fire", faction: "government" },
  消防验收窗口: { category: "owner_regulator", type: "fire", faction: "government" },
  人防审批窗口: { category: "owner_regulator", type: "regulator", faction: "government" },
  生态环境窗口: { category: "owner_regulator", type: "regulator", faction: "government" },
  水务窗口: { category: "owner_regulator", type: "regulator", faction: "government" },
  市政园林窗口: { category: "owner_regulator", type: "regulator", faction: "government" },
  公共资源交易中心: { category: "owner_regulator", type: "regulator", faction: "government" },
  竣工备案窗口: { category: "owner_regulator", type: "regulator", faction: "government" },
  设计院: { category: "design_supply", type: "design", faction: "consultant" },
  勘察单位: { category: "design_supply", type: "design", faction: "consultant" },
  图审机构: { category: "design_supply", type: "design", faction: "consultant" },
  造价咨询公司: { category: "professional_consulting", type: "consultant", faction: "consultant" },
  招标代理公司: { category: "professional_consulting", type: "consultant", faction: "consultant" },
  全过程咨询单位: { category: "professional_consulting", type: "consultant", faction: "consultant" },
  材料检测机构: { category: "professional_consulting", type: "consultant", faction: "consultant" },
  桩基检测机构: { category: "professional_consulting", type: "consultant", faction: "consultant" },
  监测单位: { category: "professional_consulting", type: "consultant", faction: "consultant" },
  消防检测机构: { category: "professional_consulting", type: "consultant", faction: "consultant" },
  环境检测机构: { category: "professional_consulting", type: "consultant", faction: "consultant" },
  绿建咨询单位: { category: "professional_consulting", type: "consultant", faction: "consultant" },
  测绘单位: { category: "professional_consulting", type: "consultant", faction: "consultant" },
  审计结算单位: { category: "professional_consulting", type: "consultant", faction: "consultant" },
  专项顾问单位: { category: "professional_consulting", type: "consultant", faction: "consultant" },
  设备厂家: { category: "design_supply", type: "supplier", faction: "supplier" },
  通信单位: { category: "design_supply", type: "supplier", faction: "supplier" },
  燃气单位: { category: "design_supply", type: "supplier", faction: "supplier" },
  供电单位: { category: "design_supply", type: "supplier", faction: "supplier" },
  水务单位: { category: "design_supply", type: "supplier", faction: "supplier" },
  停车系统单位: { category: "design_supply", type: "supplier", faction: "supplier" },
  运营方: { category: "operation", type: "merchant", faction: "merchant" },
  "物业/运营": { category: "operation", type: "property", faction: "property" },
  物业公司: { category: "operation", type: "property", faction: "property" },
  "物业/弱电单位": { category: "operation", type: "property", faction: "property" },
};

export function getOrganizationPayload(organization: string): OrganizationPayloadMeta {
  return (
    ORGANIZATION_PAYLOAD[organization] ?? {
      category: "construction",
      type: "contractor",
      faction: "other",
    }
  );
}

export function listKnownOrganizations(): string[] {
  return Object.keys(ORGANIZATION_PAYLOAD);
}
