export type Job =
  | "DOCUMENT_ASSISTANT"
  | "CONSTRUCTION_ASSISTANT"
  | "SAFETY_ASSISTANT"
  | "MECHANICAL_ASSISTANT"
  | "COST_ASSISTANT"
  | "MATERIAL_ASSISTANT"
  | "QUALITY_ASSISTANT";

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "EXPIRED";
export type ParticipantStatus = "JOINED" | "RESOLVED" | "FAILED";
export type ProjectStatus = "ACTIVE" | "WON" | "LOST";
export type LogType = "TASK" | "METRIC" | "ACHIEVEMENT" | "SYSTEM" | "BROADCAST";
export type BroadcastStatus = "PENDING" | "SENT" | "MOCK" | "FAILED";
