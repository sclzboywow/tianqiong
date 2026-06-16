import { prisma } from "../src/prisma/client";
import { ensureProjectState } from "../src/game/projectEngine";
import { spawnTasksFromTemplates } from "../src/game/taskEngine";
import { TASK_TEMPLATES } from "../src/data/taskTemplates";
import { seedPayloadCollections } from "../src/lib/payloadSeed";

async function seedPayload() {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("../payload.config")).default;
    const payload = await getPayload({ config });
    await seedPayloadCollections(payload, TASK_TEMPLATES);
    console.log("Payload seed completed");
  } catch (error) {
    console.warn("Payload seed skipped or partial:", error);
  }
}

async function main() {
  await ensureProjectState();
  await spawnTasksFromTemplates(TASK_TEMPLATES);
  await seedPayload();
  console.log("Game seed completed");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
