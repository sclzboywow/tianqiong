/**
 * CLI Payload seed（与 POST /api/admin/seed 同路径，无需浏览器登录）
 */
import { prisma } from "../src/prisma/client";
import { initializeProjectForSeed } from "../src/game/projectEngine";
import { spawnTasksFromTemplates, filterTemplatesForCurrentStage } from "../src/game/taskEngine";
import { getTaskTemplates } from "../src/game/contentLoader";
import { TASK_TEMPLATES } from "../src/data/taskTemplates";
import { normalizeStageId } from "../src/game/projectStages";
import { seedPayloadCollections } from "../src/lib/payloadSeed";
  const overwrite = process.env.SEED_OVERWRITE === "true";
  console.log("Payload seed starting...", { overwrite });

  const project = await initializeProjectForSeed();

  const { getPayload } = await import("payload");
  const config = (await import("@payload-config")).default;
  const payload = await getPayload({ config });

  const stats = await seedPayloadCollections(payload, TASK_TEMPLATES, { overwrite });
  console.log("Payload seed completed", { overwrite, stats });

  const templates = await getTaskTemplates();
  const stageTemplates = filterTemplatesForCurrentStage(
    templates,
    normalizeStageId(project.currentStage),
  );
  await spawnTasksFromTemplates(stageTemplates);

  console.log("Game tasks spawned:", stageTemplates.length, "stage=", project.currentStage);
}

main()
  .catch((error) => {
    console.error("Payload seed failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
