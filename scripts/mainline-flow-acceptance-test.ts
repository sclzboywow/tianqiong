/**
 * 建设项目主线全流程验收（INITIATION → CONSTRUCTION，取得 construction_permit）
 * 运行：npm run test:mainline-flow（需 dev 服务 + .env）
 */
import { prisma } from "../src/prisma/client";
import { sealData } from "iron-session";
import { CONSTRUCTION_MAINLINE_TASK_SLUGS } from "../src/data/constructionProjectMainlineTasks";
import { LEGACY_CHAPTER1_TASK_SLUGS } from "../src/data/legacyChapter1Slugs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const COOKIE_NAME = "tianqiong_session";

type StepResult = { step: string; ok: boolean; detail?: string };

const results: StepResult[] = [];

function log(step: string, ok: boolean, detail?: string) {
  results.push({ step, ok, detail });
  console.log(`${ok ? "✓" : "✗"} ${step}${detail ? ` — ${detail}` : ""}`);
}

async function buildSessionCookie(): Promise<string> {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) throw new Error("无用户，请先注册");
  const password =
    process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long";
  const sealed = await sealData({ userId: user.id }, { password, ttl: 60 * 60 * 24 });
  return `${COOKIE_NAME}=${sealed}`;
}

async function request(
  path: string,
  options: RequestInit & { cookie?: string } = {},
): Promise<{ status: number; data: Record<string, unknown> }> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (options.cookie) headers.Cookie = options.cookie;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

async function main() {
  console.log("\n=== 建设项目主线流程验收 ===\n");
  let failed = false;
  const cookie = await buildSessionCookie();

  {
    const { status, data } = await request("/api/ops/mainline-debug/reset", {
      method: "POST",
      cookie,
    });
    const ok = status === 200 && data.ok === true;
    log("1. 重置主线", ok, `阶段=${data.currentStage}, spawn=${data.spawnedTasks}`);
    if (!ok) failed = true;
  }

  {
    const { status, data } = await request("/api/tasks", { cookie });
    const tasks = (data.tasks as { templateId?: string }[]) || [];
    const legacy = LEGACY_CHAPTER1_TASK_SLUGS.filter((slug) =>
      tasks.some((t) => t.templateId === slug),
    );
    const ok = status === 200 && legacy.length === 0;
    log("2. INITIATION 无旧 chapter1 任务", ok, legacy.length ? `仍含: ${legacy.join(",")}` : "通过");
    if (!ok) failed = true;
  }

  let lastStage = "INITIATION";
  for (let i = 0; i < CONSTRUCTION_MAINLINE_TASK_SLUGS.length; i++) {
    const slug = CONSTRUCTION_MAINLINE_TASK_SLUGS[i];
    const { status, data } = await request("/api/ops/mainline-debug/complete-task", {
      method: "POST",
      cookie,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskSlug: slug }),
    });
    const ok = status === 200 && data.ok === true;
    const stage = String(data.currentStage || "?");
    if (stage !== lastStage) {
      log(`   → 阶段推进`, true, `${lastStage} → ${stage}`);
      lastStage = stage;
    }
    log(`3.${i + 1} 完成 ${slug}`, ok, stage);
    if (!ok) {
      failed = true;
      console.log("   错误:", data.error);
      break;
    }
  }

  {
    const { status, data } = await request("/api/ops/mainline-debug/status", { cookie });
    const milestones = (data.milestones || {}) as Record<string, boolean>;
    const artifacts = (data.artifacts || []) as { slug: string; currentStatus: string | null }[];
    const permit = artifacts.find((a) => a.slug === "construction_permit");
    const ok =
      status === 200 &&
      permit?.currentStatus === "approved" &&
      milestones.permitPlanDone === true &&
      String(data.project && (data.project as { currentStage?: string }).currentStage) ===
        "CONSTRUCTION";
    log(
      "4. 终局：construction_permit=approved & permitPlanDone",
      ok,
      `permit=${permit?.currentStatus}, permitPlanDone=${milestones.permitPlanDone}`,
    );
    if (!ok) failed = true;
  }

  console.log(`\n${failed ? "验收失败" : "验收通过"}\n`);
  process.exit(failed ? 1 : 0);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
