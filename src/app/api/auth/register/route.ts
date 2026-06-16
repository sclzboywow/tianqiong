import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";
import { getSession } from "@/lib/session";
import { ensureProjectState } from "@/game/projectEngine";

const registerSchema = z.object({
  nickname: z.string().min(2).max(20),
  qqId: z.string().min(5).max(15),
  job: z.enum([
    "DOCUMENT_ASSISTANT",
    "CONSTRUCTION_ASSISTANT",
    "SAFETY_ASSISTANT",
    "MECHANICAL_ASSISTANT",
    "COST_ASSISTANT",
    "MATERIAL_ASSISTANT",
    "QUALITY_ASSISTANT",
  ]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { qqId: data.qqId } });
    if (existing) {
      const session = await getSession();
      session.userId = existing.id;
      await session.save();
      return NextResponse.json({ user: existing, existing: true });
    }

    const user = await prisma.user.create({ data });
    await ensureProjectState();

    const session = await getSession();
    session.userId = user.id;
    await session.save();

    return NextResponse.json({ user, existing: false });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "注册失败" },
      { status: 500 },
    );
  }
}
