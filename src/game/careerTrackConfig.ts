import type { Job } from "./prisma-types";

export type CareerTrackId =
  | "document_track"
  | "site_track"
  | "risk_safety_track"
  | "cost_contract_track"
  | "coordination_track";

export type CareerTrackConfig = {
  id: CareerTrackId;
  title: string;
  description: string;
  adaptedTasks: string[];
  bonusDescription: string;
};

export const CAREER_TRACKS: CareerTrackConfig[] = [
  {
    id: "document_track",
    title: "资料线",
    description: "擅长资料完整度、台账、归档和报批材料。",
    adaptedTasks: ["资料台账", "档案资料室", "报批清单"],
    bonusDescription: "资料类任务成功率提示增强。",
  },
  {
    id: "site_track",
    title: "现场线",
    description: "擅长现场问题、施工组织、进度执行。",
    adaptedTasks: ["现场协调", "进度核查", "施工问题"],
    bonusDescription: "现场行动和进度类任务提示增强。",
  },
  {
    id: "risk_safety_track",
    title: "安全风险线",
    description: "擅长风险识别、安全隐患和质量问题。",
    adaptedTasks: ["风险清单", "安全隐患", "质量整改"],
    bonusDescription: "风险类任务提示增强。",
  },
  {
    id: "cost_contract_track",
    title: "造价合同线",
    description: "擅长成本、合同、招采、变更和付款节点。",
    adaptedTasks: ["招采准备", "合同接口", "成本控制"],
    bonusDescription: "成本合同类任务提示增强。",
  },
  {
    id: "coordination_track",
    title: "综合协调线",
    description: "擅长会议、沟通、甲方信任和问题闭环。",
    adaptedTasks: ["协调会", "参建单位沟通", "甲方接口"],
    bonusDescription: "协调类任务提示增强。",
  },
];

export const CAREER_TRACK_BY_ID = Object.fromEntries(
  CAREER_TRACKS.map((track) => [track.id, track]),
) as Record<CareerTrackId, CareerTrackConfig>;

const JOB_TO_TRACK: Partial<Record<Job, CareerTrackId>> = {
  DOCUMENT_ASSISTANT: "document_track",
  CONSTRUCTION_ASSISTANT: "site_track",
  SAFETY_ASSISTANT: "risk_safety_track",
  COST_ASSISTANT: "cost_contract_track",
  MECHANICAL_ASSISTANT: "site_track",
  MATERIAL_ASSISTANT: "cost_contract_track",
  QUALITY_ASSISTANT: "risk_safety_track",
};

export function inferCareerTrackFromJob(job: string): CareerTrackConfig {
  const trackId = JOB_TO_TRACK[job as Job] ?? "coordination_track";
  return CAREER_TRACK_BY_ID[trackId];
}
