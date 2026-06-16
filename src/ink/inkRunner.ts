import fs from "fs";
import path from "path";
import { Story } from "inkjs";

const storiesDir = path.join(process.cwd(), "src/ink/stories");

export function loadStoryJson(inkFile: string): string {
  const jsonPath = path.join(storiesDir, `${inkFile}.json`);
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Ink story not found: ${inkFile}`);
  }
  return fs.readFileSync(jsonPath, "utf-8");
}

export function createStory(inkFile: string): Story {
  const json = loadStoryJson(inkFile);
  return new Story(json);
}

export function getCurrentText(story: Story): string[] {
  const lines: string[] = [];
  while (story.canContinue) {
    const text = story.Continue();
    if (text?.trim()) lines.push(text.trim());
  }
  return lines;
}

export function getChoices(story: Story, choiceIds?: string[]) {
  return story.currentChoices.map((choice, index) => ({
    index,
    text: choice.text.trim(),
    choiceId: choiceIds?.[index] || `choice_${index}`,
  }));
}

export function makeChoice(story: Story, index: number, choiceIds?: string[]) {
  story.ChooseChoiceIndex(index);
  return {
    lines: getCurrentText(story),
    choices: getChoices(story, choiceIds),
    ended: !story.canContinue && story.currentChoices.length === 0,
  };
}

export function getStoryState(story: Story, choiceIds?: string[]) {
  return {
    lines: getCurrentText(story),
    choices: getChoices(story, choiceIds),
    ended: !story.canContinue && story.currentChoices.length === 0,
  };
}
