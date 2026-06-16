import { NextResponse } from "next/server";
import { getRanking } from "@/game/taskEngine";

export async function GET() {
  const ranking = await getRanking(20);
  return NextResponse.json({ ranking });
}
