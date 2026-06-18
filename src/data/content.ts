import type { ProjectStageId } from "@/game/projectStages";
import { LOCATION_SANDTABLE_AREAS } from "./locationSandtableAreas";

export type UnlockableWorldContent = {
  unlockStage?: ProjectStageId;
  unlockMilestones?: string[];
  relatedLocationSlugs?: string[];
  visibleWhenLocked?: boolean;
};

export type NpcData = {
  name: string;
  type: string;
  description: string;
  defaultRelation: number;
  quotes: string[];
  relatedMetrics: string[];
} & UnlockableWorldContent;

export type AreaData = {
  slug: string;
  name: string;
  shortName: string;
  sandtableRegionId: string;
  sandtableZoneId: string;
  description: string;
  stage: string;
  category?: string;
  riskTags: string[];
  sortOrder: number;
} & UnlockableWorldContent;

/** @deprecated 旧世界泛称 NPC 已移除，运行时请使用 NPC_PROFILES / Payload npcs */
export const NPCS: NpcData[] = [];

export const AREAS: AreaData[] = LOCATION_SANDTABLE_AREAS.map((area, index) => ({
  slug: area.id,
  name: area.name,
  shortName: area.shortName,
  sandtableRegionId: area.regionId,
  sandtableZoneId: area.zoneId,
  category: area.category,
  description: area.description,
  stage: area.stage,
  riskTags: area.riskTags,
  unlockStage: area.unlockStage,
  relatedLocationSlugs: area.relatedLocationSlugs,
  visibleWhenLocked: area.visibleWhenLocked,
  sortOrder: index,
}));

export const ITEMS = [
  { slug: "safety_helmet", name: "安全帽", rarity: "R", description: "基础安全防护", effectType: "safety", effectValue: 2, usable: true },
  { slug: "fire_extinguisher", name: "灭火器", rarity: "R", description: "临时消防措施", effectType: "fireRisk", effectValue: -3, usable: true },
  { slug: "document_folder", name: "资料文件夹", rarity: "R", description: "资料整理加成", effectType: "dataIntegrity", effectValue: 2, usable: true },
  { slug: "measuring_tape", name: "卷尺", rarity: "R", description: "现场测量工具", effectType: "quality", effectValue: 1, usable: true },
  { slug: "walkie_talkie", name: "对讲机", rarity: "R", description: "现场协调", effectType: "progress", effectValue: 1, usable: true },
  { slug: "blueprint_copy", name: "图纸复印件", rarity: "SR", description: "核对现场", effectType: "dataIntegrity", effectValue: 3, usable: true },
  { slug: "inspection_form", name: "检查表", rarity: "R", description: "检查记录", effectType: "safety", effectValue: 2, usable: true },
  { slug: "work_permit", name: "施工许可单", rarity: "SR", description: "合规施工", effectType: "ownerTrust", effectValue: 2, usable: true },
  { slug: "coffee", name: "提神咖啡", rarity: "R", description: "恢复精神", effectType: "spirit", effectValue: 10, usable: true },
  { slug: "energy_drink", name: "功能饮料", rarity: "R", description: "恢复体力", effectType: "stamina", effectValue: 10, usable: true },
  { slug: "quality_checklist", name: "质量检查清单", rarity: "SR", description: "质量把控", effectType: "quality", effectValue: 3, usable: true },
  { slug: "cost_calculator", name: "造价计算器", rarity: "SR", description: "成本控制", effectType: "cost", effectValue: -2, usable: true },
  { slug: "npc_contact", name: "关系通讯录", rarity: "SSR", description: "协调加成", effectType: "ownerTrust", effectValue: 4, usable: true },
  { slug: "emergency_light", name: "应急照明", rarity: "SR", description: "消防辅助", effectType: "fireRisk", effectValue: -4, usable: true },
  { slug: "seal_stamp", name: "项目章", rarity: "SSR", description: "资料盖章", effectType: "dataIntegrity", effectValue: 5, usable: true },
  { slug: "safety_rope", name: "安全绳", rarity: "R", description: "高处作业", effectType: "safety", effectValue: 3, usable: true },
  { slug: "material_tag", name: "材料标签", rarity: "R", description: "材料追溯", effectType: "quality", effectValue: 2, usable: true },
  { slug: "owner_report", name: "汇报PPT", rarity: "SR", description: "甲方汇报", effectType: "ownerTrust", effectValue: 5, usable: true },
  { slug: "property_key", name: "移交钥匙", rarity: "SSR", description: "物业移交", effectType: "propertyHandover", effectValue: 4, usable: true },
  { slug: "lucky_charm", name: "开工福袋", rarity: "UR", description: "玄学加成", effectType: "progress", effectValue: 3, usable: true },
];

export const DAILY_REPORT_TEMPLATES = [
  { title: "标准日报", templateText: "【天穹综合体 · 今日日报】\n{{metrics}}\n{{events}}" },
  { title: "消防专项", templateText: "【消防专项日报】\n消防风险：{{fireRisk}}" },
  { title: "资料专项", templateText: "【资料专项日报】\n资料完整度：{{dataIntegrity}}" },
  { title: "进度冲刺", templateText: "【进度冲刺日报】\n总进度：{{progress}}" },
  { title: "风险提示", templateText: "【风险提示】\n{{risks}}" },
];
