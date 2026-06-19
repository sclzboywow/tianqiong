export type InkStoryDef = {
  intro: string;
  choices: { text: string; id: string; result: string }[];
};

/** 旧阶段主线剧情已移除；现场/支线剧情定义见 scripts/generate-ink-stories.ts */
export const STAGE_INK_STORIES: Record<string, InkStoryDef> = {};
