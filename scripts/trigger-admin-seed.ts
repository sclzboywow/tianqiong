/**
 * 通过 dev 服务 POST /api/admin/seed 生效 Payload seed（绕过 CLI loadEnv 问题）
 */
import { prisma } from "../src/prisma/client";
import { sealData } from "iron-session";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const COOKIE_NAME = "tianqiong_session";

async function buildAdminCookie(): Promise<string> {
  const configured = (process.env.GAME_ADMIN_USER_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  let adminUserId = configured[0];
  if (!adminUserId) {
    const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
    if (!firstUser) {
      throw new Error("无用户，请先注册一名玩家或在 .env 设置 GAME_ADMIN_USER_IDS");
    }
    adminUserId = firstUser.id;
    console.log(`使用首个注册用户作为管理员: ${adminUserId.slice(0, 8)}...`);
  } else {
    console.log(`使用 GAME_ADMIN_USER_IDS 管理员: ${adminUserId.slice(0, 8)}...`);
  }

  const password =
    process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long";
  const sealed = await sealData({ userId: adminUserId }, { password, ttl: 60 * 60 * 24 });
  return `${COOKIE_NAME}=${sealed}`;
}

async function main() {
  const overwrite = process.env.SEED_OVERWRITE !== "false";
  const query = overwrite ? "?overwrite=true" : "";
  const cookie = await buildAdminCookie();

  console.log(`POST ${BASE}/api/admin/seed${query}`);
  const res = await fetch(`${BASE}/api/admin/seed${query}`, {
    method: "POST",
    headers: { Cookie: cookie },
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  console.log("HTTP", res.status);
  console.log(JSON.stringify(data, null, 2));

  if (res.status !== 200) {
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
