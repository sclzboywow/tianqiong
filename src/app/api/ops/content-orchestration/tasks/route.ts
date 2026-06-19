import { orchestrationApiHandler } from "../_shared";
import { loadOrchestrationTasksTab } from "@/game/contentOrchestrationTabs";

export async function GET(request: Request) {
  return orchestrationApiHandler(request, loadOrchestrationTasksTab);
}
