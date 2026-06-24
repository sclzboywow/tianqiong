import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: string;
}

function resolveSessionCookieSecure(): boolean {
  if (process.env.SESSION_COOKIE_SECURE === "true") return true;
  if (process.env.SESSION_COOKIE_SECURE === "false") return false;
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? process.env.GAME_BASE_URL ?? "";
  if (baseUrl.startsWith("https://")) return true;
  if (baseUrl.startsWith("http://")) return false;
  return process.env.NODE_ENV === "production";
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
  cookieName: "tianqiong_session",
  cookieOptions: {
    secure: resolveSessionCookieSecure(),
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function getCurrentUserId() {
  const session = await getSession();
  return session.userId;
}

export async function requireUserId() {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}
