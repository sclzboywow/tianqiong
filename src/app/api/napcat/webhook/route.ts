import { NextResponse } from "next/server";
import { handleNapCatMessage } from "@/napcat/handlers";

export async function POST(request: Request) {
  const body = await request.json();
  const message = body.message || body.raw_message || "";
  const reply = await handleNapCatMessage(message);
  return NextResponse.json({ reply });
}
