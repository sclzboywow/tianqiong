import { revalidatePath } from "next/cache";

/** Payload 后台保存 NPC 后调用，使协同地图等页面拿到最新数据 */
export function revalidateNpcContent() {
  revalidatePath("/locations");
}
