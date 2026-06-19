import { orchestrationApiHandler } from "../_shared";
import { loadOrchestrationStoriesTab } from "@/game/contentOrchestrationTabs";

export async function GET(request: Request) {
  return orchestrationApiHandler(request, loadOrchestrationStoriesTab);
}
