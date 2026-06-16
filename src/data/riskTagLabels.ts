export const RISK_TAG_LABELS: Record<string, string> = {
  progress: "进度",
  coordination: "协调",
  document: "资料",
  acceptance: "验收",
  ownerTrust: "甲方信任",
  approval: "报批",
  cost: "成本",
  contract: "合同",
  schedule: "工期",
  merchant: "商户",
  handover: "移交",
  planning: "规划",
  permit: "许可",
  fire: "消防",
  design: "设计",
  quality: "质量",
  material: "材料",
  mep: "机电",
  safety: "安全",
};

export function getRiskTagLabel(tag: string): string {
  return RISK_TAG_LABELS[tag] || tag;
}
