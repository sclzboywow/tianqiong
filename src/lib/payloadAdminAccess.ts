import { headers } from "next/headers";

type PayloadStaffUser = {
  id: number | string;
  role?: "admin" | "editor" | string | null;
};

export async function getPayloadStaffUser(): Promise<PayloadStaffUser | null> {
  try {
    const { getPayload } = await import("payload");
    const config = (await import("@payload-config")).default;
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: await headers() });
    if (!user) return null;
    return user as PayloadStaffUser;
  } catch {
    return null;
  }
}

export async function isPayloadStaffUser(): Promise<boolean> {
  const user = await getPayloadStaffUser();
  if (!user) return false;
  return user.role === "admin" || user.role === "editor";
}
