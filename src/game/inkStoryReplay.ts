import { createStory, getStoryState, makeChoice } from "@/ink/inkRunner";

export type InkStoryReplayState = {
  lines: string[];
  choices: { index: number; text: string; choiceId: string }[];
  ended: boolean;
};

export function replayInkStory(inkFile: string, choicePath: number[]): InkStoryReplayState {
  const story = createStory(inkFile);
  let state = getStoryState(story);
  for (const index of choicePath) {
    if (state.ended || state.choices.length === 0) break;
    if (index < 0 || index >= state.choices.length) {
      throw new Error(`无效选项索引: ${index}`);
    }
    const next = makeChoice(story, index);
    state = { ...next, ended: next.ended };
  }
  return state;
}
