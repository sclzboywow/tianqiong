import { NextResponse } from "next/server";
import { isPayloadStaffUser } from "@/lib/payloadAdminAccess";
import { getCurrentUserId } from "@/lib/session";

function configuredAdminUserIds(): string[] {
  return (process.env.GAME_ADMIN_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function hasOpsAccess(userId: string | null | undefined, payloadStaff: boolean): boolean {
  if (payloadStaff) return true;
  if (!userId) return false;
  if (process.env.NODE_ENV !== "production") return true;
  return configuredAdminUserIds().includes(userId);
}

export async function requireOpsDebugAccess() {
  const [userId, payloadStaff] = await Promise.all([
    getCurrentUserId(),
    isPayloadStaffUser(),
  ]);

  if (!userId && !payloadStaff) {
    return { error: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }

  if (!hasOpsAccess(userId, payloadStaff)) {
    return { error: NextResponse.json({ error: "无权限" }, { status: 403 }) };
  }

  return { userId: userId ?? `payload-staff` };
}

/** production：GAME_ADMIN 或 Payload 管理员/编辑；非 production 任意已登录玩家或 Payload 员工 */
export async function canAccessOpsWorkspace(): Promise<boolean> {
  const [userId, payloadStaff] = await Promise.all([
    getCurrentUserId(),
    isPayloadStaffUser(),
  ]);
  return hasOpsAccess(userId, payloadStaff);
}

export const requireOpsAccess = requireOpsDebugAccess;
