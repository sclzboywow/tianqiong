import { prisma } from "../src/prisma/client";
import { initializeProjectForSeed } from "../src/game/projectEngine";
import { spawnTasksFromTemplates, filterTemplatesForCurrentStage } from "../src/game/taskEngine";
import { TASK_TEMPLATES } from "../src/data/taskTemplates";
import { normalizeStageId } from "../src/game/projectStages";
import { seedPayloadCollections } from "../src/lib/payloadSeed";

async function seedPayload() {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("../payload.config")).default;
    const payload = await getPayload({ config });
    const overwrite = process.env.SEED_OVERWRITE === "true";
    const stats = await seedPayloadCollections(payload, TASK_TEMPLATES, { overwrite });
    console.log("Payload seed completed", { overwrite, stats });
  } catch (error) {
    console.warn("Payload seed skipped or partial:", error);
  }
}

async function main() {
  const project = await initializeProjectForSeed();
  const stageTemplates = filterTemplatesForCurrentStage(
    TASK_TEMPLATES,
    normalizeStageId(project.currentStage),
  );
  await spawnTasksFromTemplates(stageTemplates);
  await seedPayload();
  console.log("Game seed completed");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
