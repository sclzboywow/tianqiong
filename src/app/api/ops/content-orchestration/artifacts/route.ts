import { orchestrationApiHandler } from "../_shared";
import { loadOrchestrationArtifactsTab } from "@/game/contentOrchestrationTabs";

export async function GET(request: Request) {
  return orchestrationApiHandler(request, loadOrchestrationArtifactsTab);
}
