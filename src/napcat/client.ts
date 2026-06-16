import { handleNapCatMessage } from "./handlers";

export interface BroadcastClient {
  sendGroupMessage(groupId: string, content: string): Promise<void>;
}

export class MockBroadcastClient implements BroadcastClient {
  async sendGroupMessage(_groupId: string, content: string): Promise<void> {
    console.log("[MockBroadcast]", content);
  }
}

export class NapCatBroadcastClient implements BroadcastClient {
  constructor(private apiUrl: string) {}

  async sendGroupMessage(groupId: string, content: string): Promise<void> {
    await fetch(`${this.apiUrl}/send_group_msg`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: groupId, message: content }),
    });
  }
}

export function getBroadcastClient(): BroadcastClient {
  const mode = process.env.BROADCAST_MODE || "mock";
  if (mode === "napcat" && process.env.NAPCAT_API_URL) {
    return new NapCatBroadcastClient(process.env.NAPCAT_API_URL);
  }
  return new MockBroadcastClient();
}

export { handleNapCatMessage };
