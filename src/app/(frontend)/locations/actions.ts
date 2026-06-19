"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/session";
import { completeNpcTaskAction } from "@/game/npcTaskActionProgressEngine";

export async function completeNpcTaskActionAction(input: {
  taskSlug: string;
  locationId: string;
  actionId: string;
}) {
  const userId = await getCurrentUserId();

  const result = await completeNpcTaskAction({
    taskSlug: input.taskSlug,
    locationId: input.locationId,
    actionId: input.actionId,
    userId: userId ?? undefined,
  });

  if (result.ok) {
    revalidatePath("/locations");
  }

  return result;
}
