import { prisma } from "@/prisma/client";

function configuredAdminUserIds(): string[] {
  return (process.env.GAME_ADMIN_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function isGameAdmin(userId: string): Promise<boolean> {
  const configured = configuredAdminUserIds();
  if (configured.length > 0) return configured.includes(userId);

  if (process.env.NODE_ENV === "development") {
    const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    return firstUser?.id === userId;
  }

  return false;
}
