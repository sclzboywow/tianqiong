import type { CollectionConfig } from "payload";

export const Npcs: CollectionConfig = {
  slug: "npcs",
  admin: { useAsTitle: "name" },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "type", type: "text", required: true },
    { name: "description", type: "textarea" },
    { name: "defaultRelation", type: "number", defaultValue: 50 },
    { name: "quotes", type: "array", fields: [{ name: "quote", type: "text" }] },
    { name: "relatedMetrics", type: "array", fields: [{ name: "metric", type: "text" }] },
    { name: "enabled", type: "checkbox", defaultValue: true },
  ],
};

export const Areas: CollectionConfig = {
  slug: "areas",
  admin: { useAsTitle: "name" },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "description", type: "textarea" },
    { name: "stage", type: "text" },
    { name: "riskTags", type: "array", fields: [{ name: "tag", type: "text" }] },
    { name: "enabled", type: "checkbox", defaultValue: true },
  ],
};

export const EventTemplates: CollectionConfig = {
  slug: "event-templates",
  admin: { useAsTitle: "title" },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "rarity", type: "select", options: ["R", "SR", "SSR", "UR"], required: true },
    { name: "area", type: "text" },
    { name: "npcList", type: "array", fields: [{ name: "npc", type: "text" }] },
    { name: "eventType", type: "text" },
    { name: "inkFile", type: "text", required: true },
    { name: "recommendedJobs", type: "array", fields: [{ name: "job", type: "text" }] },
    { name: "baseSuccessRate", type: "number", defaultValue: 60 },
    { name: "triggerBroadcast", type: "checkbox", defaultValue: false },
    { name: "enabled", type: "checkbox", defaultValue: true },
  ],
};

export const TaskTemplates: CollectionConfig = {
  slug: "task-templates",
  admin: { useAsTitle: "title" },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "title", type: "text", required: true },
    { name: "description", type: "textarea" },
    { name: "rarity", type: "select", options: ["R", "SR", "SSR", "UR"], required: true },
    { name: "sourceType", type: "text", required: true },
    { name: "sourceName", type: "text" },
    { name: "area", type: "text", required: true },
    { name: "npcList", type: "array", fields: [{ name: "npc", type: "text" }] },
    { name: "requiredJobs", type: "array", fields: [{ name: "job", type: "text" }] },
    { name: "requiredCount", type: "number", defaultValue: 1 },
    { name: "deadlineHours", type: "number" },
    { name: "successEffects", type: "json" },
    { name: "failEffects", type: "json" },
    { name: "choiceEffects", type: "json" },
    { name: "inkFile", type: "text", required: true },
    { name: "baseSuccessRate", type: "number", defaultValue: 60 },
    { name: "triggerBroadcast", type: "checkbox", defaultValue: false },
    { name: "enabled", type: "checkbox", defaultValue: true },
  ],
};

export const Items: CollectionConfig = {
  slug: "items",
  admin: { useAsTitle: "name" },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "name", type: "text", required: true },
    { name: "rarity", type: "select", options: ["R", "SR", "SSR", "UR"] },
    { name: "description", type: "textarea" },
    { name: "effectType", type: "text" },
    { name: "effectValue", type: "number" },
    { name: "usable", type: "checkbox", defaultValue: true },
    { name: "enabled", type: "checkbox", defaultValue: true },
  ],
};

export const Achievements: CollectionConfig = {
  slug: "achievements",
  admin: { useAsTitle: "name" },
  fields: [
    { name: "slug", type: "text", required: true, unique: true },
    { name: "name", type: "text", required: true },
    { name: "description", type: "textarea" },
    { name: "conditionType", type: "text", required: true },
    { name: "conditionValue", type: "json" },
    { name: "rewardConfig", type: "json" },
    { name: "broadcastEnabled", type: "checkbox", defaultValue: false },
    { name: "enabled", type: "checkbox", defaultValue: true },
  ],
};

export const DailyReportTemplates: CollectionConfig = {
  slug: "daily-report-templates",
  admin: { useAsTitle: "title" },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "templateText", type: "textarea", required: true },
    { name: "conditions", type: "json" },
    { name: "enabled", type: "checkbox", defaultValue: true },
  ],
};
