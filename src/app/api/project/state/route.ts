import { NextResponse } from "next/server";
import { getProjectState } from "@/game/projectEngine";

export async function GET() {
  const project = await getProjectState();
  return NextResponse.json({ project });
}
