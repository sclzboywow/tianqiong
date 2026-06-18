import type { CollectionConfig } from "payload";
import { METRIC_SELECT_OPTIONS } from "@/game/metricConfig";
import { BUILD_STAGE_OPTIONS, MILESTONE_LABELS, PROJECT_STAGES, RESOLUTION_MODE_OPTIONS } from "@/game/projectStages";
import {
  ACHIEVEMENT_CATEGORIES,
  AREA_CATEGORIES,
  EVENT_CATEGORIES,
  ITEM_CATEGORIES,
  MAP_LOCATION_CATEGORIES,
  NPC_CATEGORIES,
  SANDTABLE_REGION_OPTIONS,
  SANDTABLE_ZONE_OPTIONS,
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
  { label: "咨询", value: "consultant" },
  { label: "供应商", value: "supplier" },
  { label: "商户", value: "merchant" },
  { label: "物业", value: "property" },
];

const NPC_LEVEL_OPTIONS = [
  { label: "S 决策层", value: "S" },
  { label: "A 关键执行", value: "A" },
  { label: "B 专业支撑", value: "B" },
  { label: "C 现场/临时", value: "C" },
];

const NPC_FACTION_OPTIONS = [
  { label: "业主", value: "owner" },
  { label: "总包", value: "contractor" },
  { label: "监理", value: "supervisor" },
  { label: "政府", value: "government" },
  { label: "咨询/设计", value: "consultant" },
  { label: "供应商", value: "supplier" },
  { label: "商户", value: "merchant" },
  { label: "物业", value: "property" },
  { label: "劳务", value: "labor" },
  { label: "公众", value: "public" },
  { label: "其他", value: "other" },
];

const AREA_STAGE_OPTIONS = [
  { label: "精装修", value: "精装修" },
  { label: "机电", value: "机电" },
  { label: "消防", value: "消防" },
  { label: "资料", value: "资料" },
  { label: "移交", value: "移交" },
  { label: "材料", value: "材料" },
  { label: "管理", value: "管理" },
];

const RARITY_OPTIONS = ["R", "SR", "SSR", "UR"];

const MAP_LOCATION_TYPE_OPTIONS = [
  { label: "建设主体", value: "owner_office" },
  { label: "项目部", value: "project_office" },
  { label: "政府单位", value: "government" },
  { label: "第三方机构", value: "third_party" },
  { label: "施工现场", value: "site_zone" },
];

const MAP_LOCATION_GROUP_OPTIONS = [
  { label: "建设主体", value: "建设主体" },
  { label: "项目部", value: "项目部" },
  { label: "政府单位", value: "政府单位" },
  { label: "第三方机构", value: "第三方机构" },
  { label: "施工现场", value: "施工现场" },
];

const MAP_UNLOCK_STAGE_OPTIONS = PROJECT_STAGES.map((stage) => ({
  label: stage.name,
  value: stage.id,
}));

const MILESTONE_OPTIONS = Object.entries(MILESTONE_LABELS).map(([value, label]) => ({
  label,
  value,
}));

const STORY_TYPE_OPTIONS = [
  { label: "主线阶段", value: "mainline_stage" },
  { label: "任务剧情", value: "task_story" },
  { label: "事件剧情", value: "event_story" },
  { label: "地点剧情", value: "location_story" },
  { label: "NPC 对话", value: "npc_dialogue" },
  { label: "结局", value: "ending" },
];

const STORY_STATUS_OPTIONS = [
  { label: "草稿", value: "draft" },
  { label: "已发布", value: "published" },
];

const ACHIEVEMENT_CONDITION_OPTIONS = [
  { label: "任务完成次数", value: "task_complete_count" },
  { label: "指定选项", value: "choice_made" },
  { label: "稀有度任务完成", value: "task_rarity_complete" },
  { label: "指标阈值", value: "metric_threshold" },
];

function metricEffectRowFields() {
  return [
    {
      name: "metric",
      type: "select" as const,
      label: "指标",
      required: true,
      options: METRIC_SELECT_OPTIONS,
    },
    { name: "value", type: "number" as const, label: "变化值", required: true },
    { name: "note", type: "text" as const, label: "备注" },
  ];
}

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

function unlockContentFields() {
  return [
    {
      name: "unlockStage",
      type: "select" as const,
      label: "解锁阶段",
      required: true,
      defaultValue: "INITIATION",
      options: MAP_UNLOCK_STAGE_OPTIONS,
      admin: { description: "项目进入该阶段后内容可见。" },
    },
    {
      name: "unlockMilestones",
      type: "array" as const,
      label: "解锁关键节点",
      admin: { description: "可选。需同时满足所选关键节点才解锁。" },
      fields: [
        {
          name: "milestone",
          type: "select" as const,
          label: "关键节点",
          options: MILESTONE_OPTIONS,
        },
      ],
    },
    {
      name: "relatedLocationSlugs",
      type: "array" as const,
      label: "关联地图地点",
      fields: [{ name: "slug", type: "text" as const, label: "地点 slug" }],
    },
    {
      name: "visibleWhenLocked",
      type: "checkbox" as const,
      label: "未解锁时预告展示",
      defaultValue: false,
      admin: {
        description: "关闭时未解锁内容完全不展示；开启时以灰色「尚未出现」预告展示。",
      },
    },
  ];
}

export const Npcs: CollectionConfig = {
  slug: "npcs",
  labels: { singular: "NPC", plural: "NPC" },
  admin: {
    useAsTitle: "name",
    group: "世界设定",
    defaultColumns: ["name", "slug", "title", "level", "organization", "category", "type", "enabled"],
    listSearchableFields: [
      "name",
      "slug",
      "excelId",
      "title",
      "organization",
      "level",
      "faction",
      "category",
      "type",
      "description",
    ],
    description: "协同地图角色库：与前端 npcProfiles.ts 同步，含分级与职衔。",
  },
  fields: [
    categoryField(NPC_CATEGORIES, "按组织角色归类，方便批量查找和维护。"),
    {
      name: "slug",
      type: "text",
      label: "标识",
      unique: true,
      admin: { description: "Profile ID，如 owner_project_director；旧版泛称 NPC 可留空。" },
    },
    {
      name: "excelId",
      type: "text",
      label: "Excel NPC_ID",
      admin: { description: "如 NPC040，与策划表一致。" },
    },
    { name: "name", type: "text", label: "名称", required: true },
    { name: "title", type: "text", label: "职衔" },
    {
      name: "organization",
      type: "text",
      label: "所属阵营/单位",
      admin: { description: "Excel「所属阵营/单位」原值，如造价咨询公司。" },
    },
    {
      name: "residentRegion",
      type: "text",
      label: "常驻大区",
      admin: { description: "Excel「常驻大区」原值。" },
    },
    {
      name: "sandtableRegionId",
      type: "select",
      label: "沙盘大区 ID",
      options: SANDTABLE_REGION_OPTIONS,
    },
    {
      name: "level",
      type: "select",
      label: "分级",
      options: NPC_LEVEL_OPTIONS,
      admin: { description: "S/A/B/C，与协同地图 NPC 卡片一致。" },
    },
    {
      name: "faction",
      type: "select",
      label: "阵营",
      options: NPC_FACTION_OPTIONS,
    },
    {
      name: "type",
      type: "select",
      label: "类型",
      required: true,
      options: NPC_TYPE_OPTIONS,
    },
    { name: "description", type: "textarea", label: "任务功能" },
    { name: "taskFunction", type: "textarea", label: "任务功能（备份）", admin: { description: "与描述同源，便于后台筛选。" } },
    { name: "personality", type: "text", label: "性格" },
    { name: "agenda", type: "textarea", label: "诉求/议程" },
    {
      name: "helpsWith",
      type: "array",
      label: "可协助事项",
      fields: [{ name: "item", type: "text", label: "事项" }],
    },
    {
      name: "blocksWhen",
      type: "array",
      label: "阻碍条件",
      fields: [{ name: "item", type: "text", label: "条件" }],
    },
    {
      name: "riskTags",
      type: "array",
      label: "风险标签",
      fields: [{ name: "tag", type: "text", label: "标签" }],
    },
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
    ...unlockContentFields(),
    { name: "enabled", type: "checkbox", label: "启用", defaultValue: true },
  ],
};

export const Areas: CollectionConfig = {
  slug: "areas",
  labels: { singular: "沙盘区域", plural: "沙盘区域" },
  admin: {
    useAsTitle: "name",
    group: "世界设定",
    defaultColumns: ["name", "sandtableRegionId", "sandtableZoneId", "category", "unlockStage", "enabled"],
    listSearchableFields: ["name", "slug", "shortName", "sandtableRegionId", "sandtableZoneId", "category", "description"],
    description: "协同地图沙盘节点：与前端六区布局一致，供任务/事件 triggerAreaNames 引用。",
  },
  fields: [
    categoryField(AREA_CATEGORIES, "按功能分区归类，方便按场景批量调整。"),
    {
      name: "slug",
      type: "text",
      label: "标识",
      required: true,
      unique: true,
      admin: { description: "沙盘节点 ID，如 area_site_1f" },
    },
    { name: "name", type: "text", label: "名称", required: true },
    { name: "shortName", type: "text", label: "简称" },
    {
      name: "sandtableRegionId",
      type: "select",
      label: "沙盘大区",
      required: true,
      options: SANDTABLE_REGION_OPTIONS,
      admin: { description: "对应协同地图六大区域。" },
    },
    {
      name: "sandtableZoneId",
      type: "select",
      label: "沙盘分区",
      required: true,
      options: SANDTABLE_ZONE_OPTIONS,
      admin: { description: "大区内的功能分区。" },
    },
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
    ...unlockContentFields(),
    {
      name: "sortOrder",
      type: "number",
      label: "排序",
      defaultValue: 0,
      admin: { description: "同分区内排序，数字越小越靠前。" },
    },
    { name: "enabled", type: "checkbox", label: "启用", defaultValue: true },
  ],
};

export const MapLocations: CollectionConfig = {
  slug: "map-locations",
  labels: { singular: "地图地点", plural: "协同地图" },
  admin: {
    useAsTitle: "name",
    group: "世界设定",
    defaultColumns: ["name", "sandtableRegionId", "sandtableZoneId", "group", "unlockStage", "enabled"],
    listSearchableFields: ["name", "slug", "sandtableRegionId", "sandtableZoneId", "category", "group", "description"],
    description: "协同地图可进入地点：配置沙盘位置、解锁阶段、关联任务与 NPC。保存后前端 /locations 实时读取。",
  },
  fields: [
    categoryField(MAP_LOCATION_CATEGORIES, "按地图分组归类，与协同地图页面分组一致。"),
    {
      name: "slug",
      type: "text",
      label: "标识",
      required: true,
      unique: true,
      admin: { description: "唯一 ID，用于 URL，如 owner_project_management_dept" },
    },
    { name: "name", type: "text", label: "名称", required: true },
    {
      name: "sandtableRegionId",
      type: "select",
      label: "沙盘大区",
      required: true,
      options: SANDTABLE_REGION_OPTIONS,
    },
    {
      name: "sandtableZoneId",
      type: "select",
      label: "沙盘分区",
      required: true,
      options: SANDTABLE_ZONE_OPTIONS,
    },
    {
      name: "type",
      type: "select",
      label: "地点类型",
      required: true,
      options: MAP_LOCATION_TYPE_OPTIONS,
    },
    {
      name: "group",
      type: "select",
      label: "地图分组",
      required: true,
      options: MAP_LOCATION_GROUP_OPTIONS,
    },
    { name: "description", type: "textarea", label: "描述", required: true },
    {
      name: "unlockStage",
      type: "select",
      label: "解锁阶段",
      required: true,
      options: MAP_UNLOCK_STAGE_OPTIONS,
      admin: { description: "项目进入该阶段后地点可见。" },
    },
    {
      name: "unlockMilestones",
      type: "array",
      label: "解锁关键节点",
      admin: { description: "可选。需同时满足所选关键节点才解锁。" },
      fields: [
        {
          name: "milestone",
          type: "select",
          label: "关键节点",
          options: MILESTONE_OPTIONS,
        },
      ],
    },
    {
      name: "relatedTaskSlugs",
      type: "array",
      label: "关联任务标识",
      fields: [{ name: "slug", type: "text", label: "任务 slug" }],
    },
    {
      name: "relatedAreaNames",
      type: "array",
      label: "关联区域名称",
      fields: [{ name: "name", type: "text", label: "区域名称" }],
    },
    {
      name: "relatedNpcNames",
      type: "array",
      label: "关联 NPC",
      fields: [{ name: "name", type: "text", label: "NPC 名称" }],
    },
    {
      name: "riskTags",
      type: "array",
      label: "风险标签",
      fields: [{ name: "tag", type: "text", label: "标签" }],
    },
    {
      name: "achievementHooks",
      type: "array",
      label: "成就钩子",
      admin: { description: "预留字段，供后续成就系统引用。" },
      fields: [{ name: "hook", type: "text", label: "钩子标识" }],
    },
    {
      name: "sortOrder",
      type: "number",
      label: "排序",
      defaultValue: 0,
      admin: { description: "同分组内排序，数字越小越靠前。" },
    },
    { name: "enabled", type: "checkbox", label: "启用", defaultValue: true },
  ],
};

export const StoryEntries: CollectionConfig = {
  slug: "story-entries",
  labels: { singular: "剧情入口", plural: "剧情入口" },
  admin: {
    useAsTitle: "title",
    group: "玩法内容",
    defaultColumns: ["title", "slug", "storyType", "status", "inkFile", "enabled"],
    listSearchableFields: ["title", "slug", "inkFile", "description"],
    description: "统一管理 Ink 剧情入口，供任务、事件、地点行动引用 storySlug。",
  },
  fields: [
    {
      name: "slug",
      type: "text",
      label: "标识",
      required: true,
      unique: true,
      admin: { description: "唯一 ID，通常与 inkFile 同名，如 setup_project_team" },
    },
    { name: "title", type: "text", label: "标题", required: true },
    { name: "description", type: "textarea", label: "说明" },
    {
      name: "storyType",
      type: "select",
      label: "剧情类型",
      options: STORY_TYPE_OPTIONS,
      required: true,
      defaultValue: "task_story",
    },
    {
      name: "status",
      type: "select",
      label: "状态",
      options: STORY_STATUS_OPTIONS,
      defaultValue: "draft",
      required: true,
    },
    { name: "inkFile", type: "text", label: "Ink 文件", required: true },
    {
      name: "compiledFile",
      type: "text",
      label: "编译产物",
      admin: { description: "可选。默认 src/ink/stories/{inkFile}.json" },
    },
    { name: "startKnot", type: "text", label: "起始 Knot" },
    {
      name: "stage",
      type: "select",
      label: "建设阶段",
      options: BUILD_STAGE_OPTIONS,
    },
    {
      name: "relatedLocationSlugs",
      type: "array",
      label: "关联地点",
      fields: [{ name: "slug", type: "text", label: "地点 slug" }],
    },
    {
      name: "relatedTaskSlugs",
      type: "array",
      label: "关联任务",
      fields: [{ name: "slug", type: "text", label: "任务 slug" }],
    },
    {
      name: "relatedEventSlugs",
      type: "array",
      label: "关联事件",
      fields: [{ name: "slug", type: "text", label: "事件 slug" }],
    },
    {
      name: "relatedNpcNames",
      type: "array",
      label: "关联 NPC",
      fields: [{ name: "name", type: "text", label: "NPC 名称" }],
    },
    {
      name: "tags",
      type: "array",
      label: "标签",
      fields: [{ name: "tag", type: "text", label: "标签" }],
    },
    { name: "previewText", type: "textarea", label: "预览摘要" },
    { name: "estimatedMinutes", type: "number", label: "预计时长（分钟）", min: 1 },
    { name: "sortOrder", type: "number", label: "排序", defaultValue: 0 },
    { name: "enabled", type: "checkbox", label: "启用", defaultValue: true },
  ],
};

export const EventTemplates: CollectionConfig = {
  slug: "event-templates",
  labels: { singular: "事件模板", plural: "事件模板" },
  admin: {
    useAsTitle: "title",
    group: "玩法内容",
    defaultColumns: ["title", "slug", "triggerStage", "weight", "enabled"],
    listSearchableFields: ["title", "category", "area", "eventType", "inkFile", "slug"],
    description: "事件池模板：配置触发条件与关联任务。地点行动执行后可按权重随机触发。",
  },
  fields: [
    categoryField(EVENT_CATEGORIES, "按玩法主题归类，方便后续扩展和批量修改。"),
    {
      name: "slug",
      type: "text",
      label: "标识",
      required: true,
      unique: true,
      admin: { description: "唯一 ID，如 evt_risk_register" },
    },
    { name: "title", type: "text", label: "标题", required: true },
    { name: "description", type: "textarea", label: "说明" },
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
    {
      name: "storySlug",
      type: "text",
      label: "剧情入口",
      admin: { description: "优先使用 storySlug 关联 StoryEntry；为空时回退 inkFile。" },
    },
    { name: "inkFile", type: "text", label: "Ink 文件", required: true },
    {
      name: "recommendedJobs",
      type: "array",
      label: "推荐岗位",
      fields: [{ name: "job", type: "text", label: "岗位" }],
    },
    { name: "baseSuccessRate", type: "number", label: "基础成功率", defaultValue: 60 },
    { name: "triggerBroadcast", type: "checkbox", label: "触发广播", defaultValue: false },
    {
      name: "triggerStage",
      type: "select",
      label: "触发阶段",
      options: BUILD_STAGE_OPTIONS,
      admin: { description: "留空表示任意阶段可触发。" },
    },
    {
      name: "triggerLocationSlugs",
      type: "array",
      label: "触发地点",
      fields: [{ name: "slug", type: "text", label: "地点 slug" }],
    },
    {
      name: "triggerAreaNames",
      type: "array",
      label: "触发区域",
      fields: [{ name: "name", type: "text", label: "区域名称" }],
    },
    {
      name: "triggerNpcNames",
      type: "array",
      label: "触发 NPC",
      fields: [{ name: "name", type: "text", label: "NPC 名称" }],
    },
    {
      name: "riskTags",
      type: "array",
      label: "风险标签",
      fields: [{ name: "tag", type: "text", label: "标签" }],
    },
    {
      name: "unlockMilestones",
      type: "array",
      label: "解锁关键节点",
      fields: [
        {
          name: "milestone",
          type: "select",
          label: "关键节点",
          options: MILESTONE_OPTIONS,
        },
      ],
    },
    { name: "minDay", type: "number", label: "最早触发天数", min: 1 },
    { name: "maxDay", type: "number", label: "最晚触发天数", min: 1 },
    { name: "weight", type: "number", label: "触发权重", defaultValue: 10, min: 1 },
    { name: "onceOnly", type: "checkbox", label: "仅触发一次", defaultValue: false },
    { name: "cooldownDays", type: "number", label: "冷却天数", defaultValue: 0, min: 0 },
    {
      name: "triggerTaskSlugs",
      type: "array",
      label: "触发任务",
      fields: [{ name: "slug", type: "text", label: "任务 slug" }],
    },
    { name: "resultText", type: "textarea", label: "成功触发文案" },
    { name: "noTaskText", type: "textarea", label: "无新任务文案" },
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
      name: "successMetricEffects",
      type: "array",
      label: "成功效果（可视化）",
      admin: {
        description: "优先于下方 successEffects JSON。每项配置一个指标变化。",
      },
      fields: metricEffectRowFields(),
    },
    {
      name: "failMetricEffects",
      type: "array",
      label: "失败效果（可视化）",
      admin: {
        description: "优先于下方 failEffects JSON。",
      },
      fields: metricEffectRowFields(),
    },
    {
      name: "milestoneEffectList",
      type: "array",
      label: "关键节点效果（可视化）",
      admin: {
        description: "优先于下方 milestoneEffects JSON。完成后解锁的关键节点。",
      },
      fields: [
        {
          name: "milestone",
          type: "select",
          label: "关键节点",
          required: true,
          options: MILESTONE_OPTIONS,
        },
        { name: "value", type: "checkbox", label: "解锁", defaultValue: true },
      ],
    },
    {
      name: "choiceEffectList",
      type: "array",
      label: "选项效果（可视化）",
      admin: {
        description: "优先于下方 choiceEffects JSON。Ink 选项 ID 对应 metric 变化。",
      },
      fields: [
        { name: "choiceId", type: "text", label: "选项 ID", required: true },
        { name: "label", type: "text", label: "选项名称" },
        {
          name: "metricEffects",
          type: "array",
          label: "指标变化",
          fields: metricEffectRowFields(),
        },
        { name: "successRateDelta", type: "number", label: "成功率变化" },
        { name: "note", type: "textarea", label: "备注" },
      ],
    },
    {
      name: "milestoneEffects",
      type: "json",
      label: "关键节点效果（JSON）",
      admin: {
        description:
          '高级编辑。可视化字段为空时使用。例：{"projectOrgDone": true, "masterPlanDone": true}',
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
      label: "成功效果（JSON）",
      admin: { description: "高级编辑。可视化字段为空时使用。" },
    },
    { name: "failEffects", type: "json", label: "失败效果（JSON）" },
    { name: "choiceEffects", type: "json", label: "选项效果（JSON）" },
    {
      name: "storySlug",
      type: "text",
      label: "剧情入口",
      admin: { description: "优先使用 storySlug 关联 StoryEntry；为空时回退 inkFile。" },
    },
    { name: "inkFile", type: "text", label: "Ink 文件", required: true },
    { name: "baseSuccessRate", type: "number", label: "基础成功率", defaultValue: 60 },
    { name: "triggerBroadcast", type: "checkbox", label: "触发广播", defaultValue: false },
    { name: "enabled", type: "checkbox", label: "启用", defaultValue: true },
  ],
};

export const LocationActions: CollectionConfig = {
  slug: "location-actions",
  labels: { singular: "地点行动", plural: "地点行动" },
  admin: {
    useAsTitle: "label",
    group: "玩法内容",
    defaultColumns: ["label", "locationSlug", "unlockStage", "enabled", "sortOrder"],
    listSearchableFields: ["label", "slug", "locationSlug", "description"],
    description: "协同地图地点行动：配置消耗、门槛与触发任务。保存后前端 /locations 实时读取。",
  },
  fields: [
    {
      name: "slug",
      type: "text",
      label: "标识",
      required: true,
      unique: true,
      admin: { description: "唯一 ID，用于 API，如 action_risk_register" },
    },
    { name: "label", type: "text", label: "行动名称", required: true },
    { name: "description", type: "textarea", label: "行动说明" },
    {
      name: "locationSlug",
      type: "text",
      label: "所属地点",
      required: true,
      admin: { description: "对应 map-locations 的 slug，如 owner_project_management_dept" },
    },
    {
      name: "unlockStage",
      type: "select",
      label: "解锁阶段",
      required: true,
      options: MAP_UNLOCK_STAGE_OPTIONS,
      defaultValue: "INITIATION",
      admin: { description: "项目进入该阶段后行动可见。" },
    },
    {
      name: "unlockMilestones",
      type: "array",
      label: "解锁关键节点",
      admin: { description: "可选。需同时满足所选关键节点才解锁。" },
      fields: [
        {
          name: "milestone",
          type: "select",
          label: "关键节点",
          options: MILESTONE_OPTIONS,
        },
      ],
    },
    {
      name: "triggerTaskSlugs",
      type: "array",
      label: "触发任务",
      admin: { description: "执行行动后尝试生成的任务模板 slug。" },
      fields: [{ name: "slug", type: "text", label: "任务 slug" }],
    },
    {
      name: "storySlug",
      type: "text",
      label: "剧情入口",
      admin: { description: "可选。关联 StoryEntry，暂不强制运行时使用。" },
    },
    {
      name: "relatedNpcNames",
      type: "array",
      label: "关联 NPC",
      fields: [{ name: "name", type: "text", label: "NPC 名称" }],
    },
    {
      name: "riskTags",
      type: "array",
      label: "风险标签",
      fields: [{ name: "tag", type: "text", label: "标签" }],
    },
    { name: "staminaCost", type: "number", label: "体力消耗", min: 0 },
    { name: "spiritCost", type: "number", label: "精神消耗", min: 0 },
    { name: "minLevel", type: "number", label: "最低等级", min: 1 },
    { name: "minReputation", type: "number", label: "最低声望", min: 0 },
    {
      name: "resultText",
      type: "textarea",
      label: "成功触发文案",
      admin: { description: "成功生成任务时的提示文案。留空则使用默认文案。" },
    },
    {
      name: "noTaskText",
      type: "textarea",
      label: "无新任务文案",
      admin: { description: "相关任务已存在时的提示文案。留空则使用默认文案。" },
    },
    {
      name: "sortOrder",
      type: "number",
      label: "排序",
      defaultValue: 0,
      admin: { description: "同地点内排序，数字越小越靠前。" },
    },
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
