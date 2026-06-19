import { orchestrationApiHandler } from "../_shared";
import { loadOrchestrationHealthTab } from "@/game/contentOrchestrationTabs";

export async function GET(request: Request) {
  return orchestrationApiHandler(request, loadOrchestrationHealthTab);
}
