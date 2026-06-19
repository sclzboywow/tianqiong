import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";

function configuredAdminUserIds(): string[] {
  return (process.env.GAME_ADMIN_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function requireOpsDebugAccess() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { error: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }

  const isNonProduction = process.env.NODE_ENV !== "production";
  const isAdmin = configuredAdminUserIds().includes(userId);
  if (!isNonProduction && !isAdmin) {
    return { error: NextResponse.json({ error: "无权限" }, { status: 403 }) };
  }

  return { userId };
}

/** 与 requireOpsAccess 一致：production 仅 GAME_ADMIN；非 production 任意已登录玩家 */
export async function canAccessOpsWorkspace(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;
  if (process.env.NODE_ENV !== "production") return true;
  return configuredAdminUserIds().includes(userId);
}

export const requireOpsAccess = requireOpsDebugAccess;
