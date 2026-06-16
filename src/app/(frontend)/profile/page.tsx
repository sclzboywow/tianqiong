import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { PlayerProfile } from "@/components/PlayerProfile";
import { getCurrentUserId } from "@/lib/session";
import { prisma } from "@/prisma/client";

export default async function ProfilePage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/register");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/register");

  const inventory = await prisma.inventory.findMany({ where: { userId } });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <PlayerProfile user={user} inventory={inventory} />
      </main>
    </div>
  );
}
