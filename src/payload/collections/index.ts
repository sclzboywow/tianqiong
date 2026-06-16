import type { CollectionConfig } from "payload";
import { BUILD_STAGE_OPTIONS, RESOLUTION_MODE_OPTIONS } from "@/game/projectStages";

export const Npcs: CollectionConfig = {
  slug: "npcs",
  labels: { singular: "NPC", plural: "NPC" },
  admin: { useAsTitle: "name" },
  fields: [
    { name: "name", type: "text", label: "名称", required: true },
    { name: "type", type: "text", label: "类型", required: true },
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
  admin: { useAsTitle: "name" },
  fields: [
    { name: "name", type: "text", label: "名称", required: true },
    { name: "description", type: "textarea", label: "描述" },
    { name: "stage", type: "text", label: "阶段" },
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
  admin: { useAsTitle: "title" },
  fields: [
    { name: "title", type: "text", label: "标题", required: true },
    {
      name: "rarity",
      type: "select",
      label: "稀有度",
      options: ["R", "SR", "SSR", "UR"],
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
    description: "任务模板：配置建设阶段、关键节点、多人结算模式等。保存后通过 seed 或重启任务生成生效。",
  },
  fields: [
    { name: "slug", type: "text", label: "标识", required: true, unique: true },
    { name: "title", type: "text", label: "标题", required: true },
    { name: "description", type: "textarea", label: "描述" },
    {
      name: "rarity",
      type: "select",
      label: "稀有度",
      options: ["R", "SR", "SSR", "UR"],
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
  admin: { useAsTitle: "name" },
  fields: [
    { name: "slug", type: "text", label: "标识", required: true, unique: true },
    { name: "name", type: "text", label: "名称", required: true },
    {
      name: "rarity",
      type: "select",
      label: "稀有度",
      options: ["R", "SR", "SSR", "UR"],
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
  admin: { useAsTitle: "name" },
  fields: [
    { name: "slug", type: "text", label: "标识", required: true, unique: true },
    { name: "name", type: "text", label: "名称", required: true },
    { name: "description", type: "textarea", label: "描述" },
    { name: "conditionType", type: "text", label: "条件类型", required: true },
    { name: "conditionValue", type: "json", label: "条件值" },
    { name: "rewardConfig", type: "json", label: "奖励配置" },
    { name: "broadcastEnabled", type: "checkbox", label: "启用广播", defaultValue: false },
    { name: "enabled", type: "checkbox", label: "启用", defaultValue: true },
  ],
};

export const DailyReportTemplates: CollectionConfig = {
  slug: "daily-report-templates",
  labels: { singular: "日报模板", plural: "日报模板" },
  admin: { useAsTitle: "title" },
  fields: [
    { name: "title", type: "text", label: "标题", required: true },
    { name: "templateText", type: "textarea", label: "模板正文", required: true },
    { name: "conditions", type: "json", label: "触发条件" },
    { name: "enabled", type: "checkbox", label: "启用", defaultValue: true },
  ],
};
