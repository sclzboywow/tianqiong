"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JOB_LABELS } from "@/utils/formatter";

const JOBS = Object.entries(JOB_LABELS);

export default function RegisterPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [qqId, setQqId] = useState("");
  const [job, setJob] = useState(JOBS[0][0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, qqId, job }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "注册失败");
      router.push("/project");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Card className="border-amber-900/40 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="text-amber-400">加入天穹综合体</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">昵称</Label>
              <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qqId">QQ号</Label>
              <Input id="qqId" value={qqId} onChange={(e) => setQqId(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>选择岗位</Label>
              <div className="grid gap-2">
                {JOBS.map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={job === value ? "default" : "outline"}
                    className="justify-start"
                    onClick={() => setJob(value)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "创建中..." : "进入项目"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
