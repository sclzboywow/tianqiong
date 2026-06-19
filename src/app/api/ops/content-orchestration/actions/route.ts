import { orchestrationApiHandler } from "../_shared";
import { loadOrchestrationActionsTab } from "@/game/contentOrchestrationTabs";

export async function GET(request: Request) {
  return orchestrationApiHandler(request, loadOrchestrationActionsTab);
}
