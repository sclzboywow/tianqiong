import { orchestrationApiHandler } from "../_shared";
import { loadOrchestrationEventsTab } from "@/game/contentOrchestrationTabs";

export async function GET(request: Request) {
  return orchestrationApiHandler(request, loadOrchestrationEventsTab);
}
