export type StorySegment =
  | {
      type: "narration";
      key: string;
      text: string;
    }
  | {
      type: "dialogue";
      key: string;
      speaker: string;
      text: string;
    };

/** 标准格式：[说话人] 文本 */
export const SPEAKER_LINE_RE = /^\[([^\]]+)\]\s*(.*)$/;

/** 旧式中文引号对话 */
export const LEGACY_QUOTE_RE = /「[^」]+」/;

/** 行首 [说话人] 标记 */
export const SPEAKER_TAG_LINE_RE = /^\[[^\]]+\]/m;

const NARRATION_SPEAKERS = new Set(["旁白", "narrator", "Narrator"]);

function isNarrationSpeaker(speaker: string): boolean {
  return NARRATION_SPEAKERS.has(speaker.trim());
}

function detectSpeaker(context: string, quote: string): string | null {
  const text = `${context} ${quote}`;
  const rules: Array<[string, string[]]> = [
    ["甲方代表", ["甲方代表", "甲方", "领导", "汇报"]],
    ["资料员", ["资料员", "资料室", "名单今晚", "台账", "原件"]],
    ["监理", ["监理", "整改", "签字", "规范"]],
    ["总包", ["总包", "班组", "现场负责人", "先动"]],
    ["设计院", ["设计院", "设计", "出图", "图纸", "方案"]],
    ["造价咨询", ["造价", "控制价", "成本"]],
    ["物业", ["物业", "钥匙", "移交"]],
    ["消防专家", ["消防", "通道", "泵房"]],
  ];

  for (const [speaker, keywords] of rules) {
    if (keywords.some((keyword) => text.includes(keyword))) return speaker;
  }

  return null;
}

function parseSpeakerLine(line: string, lineIndex: number): StorySegment | null {
  const match = line.match(SPEAKER_LINE_RE);
  if (!match) return null;

  const speaker = match[1].trim();
  const text = match[2].trim();
  if (!text) return null;

  if (isNarrationSpeaker(speaker)) {
    return {
      type: "narration",
      key: `narration-bracket-${lineIndex}`,
      text,
    };
  }

  return {
    type: "dialogue",
    key: `dialogue-bracket-${lineIndex}`,
    speaker,
    text,
  };
}

function parseLegacyStoryLine(line: string, lineIndex: number, lastSpeaker: string): {
  segments: StorySegment[];
  lastSpeaker: string;
} {
  const segments: StorySegment[] = [];
  let currentSpeaker = lastSpeaker;
  const matches = [...line.matchAll(/「([^」]+)」/g)];

  if (matches.length === 0) {
    segments.push({
      type: "narration",
      key: `narration-${lineIndex}`,
      text: line,
    });
    return { segments, lastSpeaker: currentSpeaker };
  }

  let cursor = 0;
  matches.forEach((match, matchIndex) => {
    const quoteStart = match.index ?? 0;
    const quoteText = match[1].trim();
    const before = line.slice(cursor, quoteStart).trim();

    if (before) {
      segments.push({
        type: "narration",
        key: `narration-${lineIndex}-${matchIndex}`,
        text: before,
      });
    }

    const contextBefore = line.slice(Math.max(0, quoteStart - 36), quoteStart);
    const contextAfter = line.slice(quoteStart + match[0].length, quoteStart + match[0].length + 36);
    const speaker = detectSpeaker(`${contextBefore}${contextAfter}`, quoteText) || currentSpeaker;
    currentSpeaker = speaker;

    segments.push({
      type: "dialogue",
      key: `dialogue-${lineIndex}-${matchIndex}`,
      speaker,
      text: quoteText,
    });

    cursor = quoteStart + match[0].length;
  });

  const rest = line.slice(cursor).trim();
  if (rest) {
    segments.push({
      type: "narration",
      key: `narration-${lineIndex}-tail`,
      text: rest,
    });
  }

  return { segments, lastSpeaker: currentSpeaker };
}

export function buildStorySegments(lines: string[]): StorySegment[] {
  const segments: StorySegment[] = [];
  let lastSpeaker = "项目现场";

  lines.forEach((rawLine, lineIndex) => {
    const line = rawLine.trim();
    if (!line) return;

    const bracketSegment = parseSpeakerLine(line, lineIndex);
    if (bracketSegment) {
      segments.push(bracketSegment);
      if (bracketSegment.type === "dialogue") {
        lastSpeaker = bracketSegment.speaker;
      }
      return;
    }

    const legacy = parseLegacyStoryLine(line, lineIndex, lastSpeaker);
    segments.push(...legacy.segments);
    lastSpeaker = legacy.lastSpeaker;
  });

  return segments;
}

export function inkSourceUsesLegacyDialogueWithoutSpeakerTags(content: string): boolean {
  return LEGACY_QUOTE_RE.test(content) && !SPEAKER_TAG_LINE_RE.test(content);
}
