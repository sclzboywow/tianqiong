import { orchestrationApiHandler } from "../_shared";
import { loadContentOrchestrationOverview } from "@/game/contentOrchestrationTabs";

export async function GET(request: Request) {
  return orchestrationApiHandler(request, loadContentOrchestrationOverview);
}
