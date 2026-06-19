import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";
import { loadArtifactDefinitions } from "@/game/artifactLoader";
import { buildArtifactStatusMap, getArtifactStatusLabel } from "@/game/artifactEngine";
import { PROJECT_STAGES } from "@/game/projectStages";

const SEASON_ID = process.env.SEASON_ID || "season-1";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const definitions = await loadArtifactDefinitions();
  const statusMap = await buildArtifactStatusMap(SEASON_ID);

  const byStage = PROJECT_STAGES.reduce(
    (acc, stage) => {
      acc[stage.id] = [];
      return acc;
    },
    {} as Record<string, Array<{
      slug: string;
      name: string;
      stage: string;
      defaultStatus: string;
      currentStatus: string | null;
      currentStatusLabel: string;
    }>>,
  );

  for (const def of definitions) {
    const stage = def.stage || "INITIATION";
    const currentStatus = statusMap[def.slug] ?? null;
    const currentStatusLabel = await getArtifactStatusLabel(def.slug, currentStatus);
    const bucket = byStage[stage] || (byStage.INITIATION = []);
    bucket.push({
      slug: def.slug,
      name: def.name,
      stage,
      defaultStatus: def.defaultStatus || "draft",
      currentStatus,
      currentStatusLabel,
    });
  }

  return NextResponse.json({
    seasonId: SEASON_ID,
    byStage,
    total: definitions.length,
  });
}
