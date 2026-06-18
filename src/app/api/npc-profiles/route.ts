import { NextResponse } from "next/server";
import { loadFreshNpcProfilesPayload } from "@/game/npcProfileLoader";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await loadFreshNpcProfilesPayload();
  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
