import type { CollectionConfig } from "payload";
import { BUILD_STAGE_OPTIONS, RESOLUTION_MODE_OPTIONS } from "@/game/projectStages";
import {
  ACHIEVEMENT_CATEGORIES,
  AREA_CATEGORIES,
  EVENT_CATEGORIES,
  ITEM_CATEGORIES,
  NPC_CATEGORIES,
  TASK_CATEGORIES,
} from "@/payload/contentCategories";

const NPC_TYPE_OPTIONS = [
  { label: "甲方", value: "owner" },
  { label: "监理", value: "supervisor" },
  { label: "质监", value: "regulator" },
  { label: "消防", value: "fire" },
  { label: "总包", value: "contractor" },
  { label: "分包", value: "subcontractor" },
  { label: "设计", value: "design" },
  { label: "供应商", value: "supplier" },
  { label: "商户", value: "merchant" },
  { label: "物业", value: "property" },
];

const AREA_STAGE_OPTIONS = [
  { label: "精装修", value: "精装修" },
  { label: "机电", value: "机电" },
  { label: "消防", value: "消防" },
  { label: "资料", value: "资料" },
  { label: "移交", value: "移交" },
  { label: "材料", value: "材料" },
];

const RARITY_OPTIONS = ["R", "SR", "SSR", "UR"];

const ACHIEVEMENT_CONDITION_OPTIONS = [
  { label: "任务完成次数", value: "task_complete_count" },
  { label: "指定选项", value: "choice_made" },
  { label: "稀有度任务完成", value: "task_rarity_complete" },
  { label: "指标阈值", value: "metric_threshold" },
];

function categoryField(options: { label: string; value: string }[], description: string) {
  return {
    name: "category",
    type: "select" as const,
    label: "内容分类",
    required: true,
    defaultValue: options[0]?.value,
    options,
    admin: {
      description,
      position: "sidebar" as const,
    },
  };
}

export const Npcs: CollectionConfig = {
  slug: "npcs",
  labels: { singular: "NPC", plural: "NPC" },
  admin: {
    useAsTitle: "name",
    group: "世界设定",
    defaultColumns: ["name", "category", "type", "description", "enabled"],
    listSearchableFields: ["name", "category", "type", "description"],
  },
  fields: [
    categoryField(NPC_CATEGORIES, "按组织角色归类，方便批量查找和维护。"),
    { name: "name", type: "text", label: "名称", required: true },
    {
      name: "type",
      type: "select",
      label: "类型",
      required: true,
      options: NPC_TYPE_OPTIONS,
    },
    { name: "description", type: "textarea", label: "描述" },
    { name: "defaultRelation", type: "number", label: "默认关系值", defaultValue: 50 },
    {
      name: "quotes",
      type: "array",
      label: "台词",
      fields: [{ name: "quote", type: "text", label: "台词内容" }],
    },
    {
      name: "relatedMetrics",
      type: "array",
      label: "关联指标",
      fields: [{ name: "metric", type: "text", label: "指标" }],
    },
    { name: "enabled", type: "checkbox", label: "启用", defaultValue: true },
  ],
};

export const Areas: CollectionConfig = {
  slug: "areas",
  labels: { singular: "区域", plural: "区域" },
  admin: {
    useAsTitle: "name",
    group: "世界设定",
    defaultColumns: ["name", "category", "stage", "description", "enabled"],
    listSearchableFields: ["name", "category", "stage", "description"],
  },
  fields: [
    categoryField(AREA_CATEGORIES, "按功能分区归类，方便按场景批量调整。"),
    { name: "name", type: "text", label: "名称", required: true },
    { name: "description", type: "textarea", label: "描述" },
    {
      name: "stage",
      type: "select",
      label: "施工阶段",
      options: AREA_STAGE_OPTIONS,
    },
    {
      name: "riskTags",
      type: "array",
      label: "风险标签",
      fields: [{ name: "tag", type: "text", label: "标签" }],
    },
    { name: "enabled", type: "checkbox", label: "启用", defaultValue: true },
  ],
};

export const EventTemplates: CollectionConfig = {
  slug: "event-templates",
  labels: { singular: "事件模板", plural: "事件模板" },
  admin: {
    useAsTitle: "title",
    group: "玩法内容",
    defaultColumns: ["title", "category", "rarity", "area", "enabled"],
    listSearchableFields: ["title", "category", "area", "eventType", "inkFile"],
  },
  fields: [
    categoryField(EVENT_CATEGORIES, "按玩法主题归类，方便后续扩展和批量修改。"),
    { name: "title", type: "text", label: "标题", required: true },
    {
      name: "rarity",
      type: "select",
      label: "稀有度",
      options: RARITY_OPTIONS,
      required: true,
    },
    { name: "area", type: "text", label: "区域" },
    {
      name: "npcList",
      type: "array",
      label: "NPC 列表",
      fields: [{ name: "npc", type: "text", label: "NPC" }],
    },
    { name: "eventType", type: "text", label: "事件类型" },
    { name: "inkFile", type: "text", label: "Ink 文件", required: true },
    {
      name: "recommendedJobs",
      type: "array",
      label: "推荐岗位",
      fields: [{ name: "job", type: "text", label: "岗位" }],
    },
    { name: "baseSuccessRate", type: "number", label: "基础成功率", defaultValue: 60 },
    { name: "triggerBroadcast", type: "checkbox", label: "触发广播", defaultValue: false },
    { name: "enabled", type: "checkbox", label: "启用", defaultValue: true },
  ],
};

export const TaskTemplates: CollectionConfig = {
  slug: "task-templates",
  labels: { singular: "任务模板", plural: "任务模板" },
  admin: {
    useAsTitle: "title",
    group: "玩法内容",
    defaultColumns: ["title", "category", "stage", "rarity", "slug", "enabled"],
    listSearchableFields: ["title", "category", "slug", "area", "inkFile"],
    description: "任务模板：配置建设阶段、关键节点、多人结算模式等。保存后通过 seed 同步到运行时。",
  },
  fields: [
    categoryField(TASK_CATEGORIES, "与事件模板共用分类体系。主线、专项、协作分开维护。"),
    { name: "slug", type: "text", label: "标识", required: true, unique: true },
    { name: "title", type: "text", label: "标题", required: true },
    { name: "description", type: "textarea", label: "描述" },
    {
      name: "rarity",
      type: "select",
      label: "稀有度",
      options: RARITY_OPTIONS,
      required: true,
    },
    {
      name: "stage",
      type: "select",
      label: "建设阶段",
      options: BUILD_STAGE_OPTIONS,
      admin: {
        description: "任务所属建设阶段。任务大厅按当前项目阶段筛选生成。",
      },
    },
    {
      name: "resolutionMode",
      type: "select",
      label: "结算模式",
      options: RESOLUTION_MODE_OPTIONS,
      admin: {
        description: "留空则按稀有度自动推断：R=SOLO，SR=VOTE，SSR/UR=ROLE_CHECKLIST",
      },
    },
    {
      name: "minResolveCount",
      type: "number",
      label: "最少结算人数",
      min: 1,
      admin: {
        description: "统一结算所需最少提交人数。留空则 SOLO=1，多人任务至少 2 人。",
      },
    },
    {
      name: "milestoneEffects",
      type: "json",
      label: "关键节点效果",
      admin: {
        description:
          '完成后解锁的关键节点，JSON 对象。例：{"projectOrgDone": true, "masterPlanDone": true}',
      },
    },
    { name: "sourceType", type: "text", label: "来源类型", required: true },
    { name: "sourceName", type: "text", label: "来源名称" },
    { name: "area", type: "text", label: "区域", required: true },
    {
      name: "npcList",
      type: "array",
      label: "NPC 列表",
      fields: [{ name: "npc", type: "text", label: "NPC" }],
    },
    {
      name: "requiredJobs",
      type: "array",
      label: "所需岗位",
      fields: [{ name: "job", type: "text", label: "岗位" }],
    },
    { name: "requiredCount", type: "number", label: "所需人数", defaultValue: 1 },
    { name: "deadlineHours", type: "number", label: "截止小时数" },
    {
      name: "successEffects",
      type: "json",
      label: "成功效果",
      admin: { description: "成功效果。支持 stageProgress、latentRisk 及各项项目指标。" },
    },
    { name: "failEffects", type: "json", label: "失败效果" },
    { name: "choiceEffects", type: "json", label: "选项效果" },
    { name: "inkFile", type: "text", label: "Ink 文件", required: true },
    { name: "baseSuccessRate", type: "number", label: "基础成功率", defaultValue: 60 },
    { name: "triggerBroadcast", type: "checkbox", label: "触发广播", defaultValue: false },
    { name: "enabled", type: "checkbox", label: "启用", defaultValue: true },
  ],
};

export const Items: CollectionConfig = {
  slug: "items",
  labels: { singular: "道具", plural: "道具" },
  admin: {
    useAsTitle: "name",
    group: "奖励系统",
    defaultColumns: ["name", "category", "rarity", "effectType", "enabled"],
    listSearchableFields: ["name", "category", "slug", "description", "effectType"],
  },
  fields: [
    categoryField(ITEM_CATEGORIES, "按道具用途归类，方便调整奖励池和数值。"),
    { name: "slug", type: "text", label: "标识", required: true, unique: true },
    { name: "name", type: "text", label: "名称", required: true },
    {
      name: "rarity",
      type: "select",
      label: "稀有度",
      options: RARITY_OPTIONS,
    },
    { name: "description", type: "textarea", label: "描述" },
    { name: "effectType", type: "text", label: "效果类型" },
    { name: "effectValue", type: "number", label: "效果数值" },
    { name: "usable", type: "checkbox", label: "可使用", defaultValue: true },
    { name: "enabled", type: "checkbox", label: "启用", defaultValue: true },
  ],
};

export const Achievements: CollectionConfig = {
  slug: "achievements",
  labels: { singular: "成就", plural: "成就" },
  admin: {
    useAsTitle: "name",
    group: "奖励系统",
    defaultColumns: ["name", "category", "conditionType", "description", "enabled"],
    listSearchableFields: ["name", "category", "slug", "description"],
  },
  fields: [
    categoryField(ACHIEVEMENT_CATEGORIES, "按解锁方式归类，方便分批设计和调数值。"),
    { name: "slug", type: "text", label: "标识", required: true, unique: true },
    { name: "name", type: "text", label: "名称", required: true },
    { name: "description", type: "textarea", label: "描述" },
    {
      name: "conditionType",
      type: "select",
      label: "条件类型",
      options: ACHIEVEMENT_CONDITION_OPTIONS,
      required: true,
    },
    { name: "conditionValue", type: "json", label: "条件值" },
    { name: "rewardConfig", type: "json", label: "奖励配置" },
    { name: "broadcastEnabled", type: "checkbox", label: "启用广播", defaultValue: false },
    { name: "enabled", type: "checkbox", label: "启用", defaultValue: true },
  ],
};

export const DailyReportTemplates: CollectionConfig = {
  slug: "daily-report-templates",
  labels: { singular: "日报模板", plural: "日报模板" },
  admin: {
    useAsTitle: "title",
    group: "运营配置",
    defaultColumns: ["title", "enabled"],
    listSearchableFields: ["title", "templateText"],
  },
  fields: [
    { name: "title", type: "text", label: "标题", required: true },
    { name: "templateText", type: "textarea", label: "模板正文", required: true },
    { name: "conditions", type: "json", label: "触发条件" },
    { name: "enabled", type: "checkbox", label: "启用", defaultValue: true },
  ],
};
