import fs from "fs";
import path from "path";
import { createStory } from "@/ink/inkRunner";

const storiesDir = path.join(process.cwd(), "src/ink/stories");

export type InkFileRuntimeStatus = "available" | "missing" | "load_failed";

export function inkCompiledRelativePath(inkFile: string): string {
  return `src/ink/stories/${inkFile}.json`;
}

export function inkSourceRelativePath(inkFile: string): string {
  return `src/ink/stories/${inkFile}.ink`;
}

export function inkCompiledAbsolutePath(inkFile: string): string {
  return path.join(storiesDir, `${inkFile}.json`);
}

export function getInkFileRuntimeStatus(inkFile: string): InkFileRuntimeStatus {
  if (!inkFile.trim()) return "missing";
  const jsonPath = inkCompiledAbsolutePath(inkFile);
  if (!fs.existsSync(jsonPath)) return "missing";
  try {
    createStory(inkFile);
    return "available";
  } catch {
    return "load_failed";
  }
}
