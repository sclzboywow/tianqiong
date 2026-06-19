import { orchestrationApiHandler } from "../_shared";
import { loadOrchestrationCleanupTab } from "@/game/contentOrchestrationTabs";

export async function GET(request: Request) {
  return orchestrationApiHandler(request, loadOrchestrationCleanupTab);
}
