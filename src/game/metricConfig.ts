export type MetricGoodDirection = "up" | "down";

export type ProjectMetricOption = {
  key: string;
  label: string;
  description: string;
  goodDirection: MetricGoodDirection;
};

/** 任务模板可视化效果配置使用的项目指标选项 */
export const PROJECT_METRIC_OPTIONS: ProjectMetricOption[] = [
  {
    key: "stageProgress",
    label: "阶段进度",
    description: "当前建设阶段的完成进度",
    goodDirection: "up",
  },
  {
    key: "progress",
    label: "工程进度",
    description: "施工现场工程推进进度",
    goodDirection: "up",
  },
  {
    key: "quality",
    label: "质量",
    description: "工程质量水平",
    goodDirection: "up",
  },
  {
    key: "safety",
    label: "安全",
    description: "现场安全管理水平",
    goodDirection: "up",
  },
  {
    key: "cost",
    label: "成本",
    description: "成本压力（数值越高压力越大）",
    goodDirection: "down",
  },
  {
    key: "dataIntegrity",
    label: "资料完整度",
    description: "项目资料与台账完整程度",
    goodDirection: "up",
  },
  {
    key: "fireRisk",
    label: "消防风险",
    description: "消防隐患与合规风险",
    goodDirection: "down",
  },
  {
    key: "ownerTrust",
    label: "甲方信任",
    description: "甲方对项目团队的信任度",
    goodDirection: "up",
  },
  {
    key: "propertyHandover",
    label: "物业移交",
    description: "物业接管与移交准备度",
    goodDirection: "up",
  },
  {
    key: "latentRisk",
    label: "潜在风险",
    description: "尚未暴露的潜在项目风险",
    goodDirection: "down",
  },
];

export const VALID_PROJECT_METRIC_KEYS = new Set(
  PROJECT_METRIC_OPTIONS.map((option) => option.key),
);

/** 任务效果可配置的指标 key（不含 legacy progress / stageProgress） */
export type ConfigurableMetricKey = (typeof PROJECT_METRIC_OPTIONS)[number]["key"];

export const METRIC_SELECT_OPTIONS = PROJECT_METRIC_OPTIONS.map((option) => ({
  label: option.label,
  value: option.key,
}));

export const METRIC_LABELS_FROM_CONFIG: Record<string, string> = Object.fromEntries(
  PROJECT_METRIC_OPTIONS.map((option) => [option.key, option.label]),
);
