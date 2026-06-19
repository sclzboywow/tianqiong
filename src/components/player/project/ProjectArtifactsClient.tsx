"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { PROJECT_STAGES } from "@/game/projectStages";

type ArtifactRow = {
  slug: string;
  name: string;
  stage: string;
  defaultStatus: string;
  currentStatus: string | null;
  currentStatusLabel: string;
};

type ArtifactsPayload = {
  byStage: Record<string, ArtifactRow[]>;
  total: number;
};

function stageLabel(stageId: string) {
  return PROJECT_STAGES.find((s) => s.id === stageId)?.name || stageId;
}

const STAGE_ORDER = ["INITIATION", "APPROVAL", "DESIGN", "PROCUREMENT", "CONSTRUCTION"] as const;

export function ProjectArtifactsClient() {
  const [data, setData] = useState<ArtifactsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/project/artifacts")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "加载失败");
        setData(json);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"));
  }, []);

  return (
    <div className="min-h-screen bg-[#050B14] text-[#EAF3FF]">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">项目资料成果库</h1>
            <p className="mt-1 text-sm text-[#8EA3B8]">
              按阶段查看建设项目主线成果物当前状态（不含道具 Items）
            </p>
          </div>
          <Link
            href="/locations"
            className="rounded-lg border border-[rgba(60,160,255,0.25)] px-3 py-1.5 text-sm text-[#2EA8FF] hover:border-[#2EA8FF]"
          >
            返回地图
          </Link>
        </div>

        {error ? (
          <p className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-4 text-sm text-rose-200">
            {error}
          </p>
        ) : null}

        {!data && !error ? (
          <p className="text-sm text-[#8EA3B8]">加载中…</p>
        ) : null}

        {data
          ? STAGE_ORDER.map((stageId) => {
              const items = data.byStage[stageId] || [];
              if (items.length === 0) return null;
              return (
                <section key={stageId} className="mb-8">
                  <h2 className="mb-3 text-lg font-medium text-[#EAF3FF]">{stageLabel(stageId)}</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((item) => (
                      <article
                        key={item.slug}
                        className="rounded-lg border border-[rgba(60,160,255,0.15)] bg-[rgba(5,11,20,0.55)] p-4"
                      >
                        <p className="font-medium">{item.name}</p>
                        <p className="mt-1 font-mono text-xs text-[#8EA3B8]">{item.slug}</p>
                        <p className="mt-3 text-sm">
                          当前：
                          <span
                            className={
                              item.currentStatus ? "text-emerald-300" : "text-slate-400"
                            }
                          >
                            {item.currentStatusLabel}
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-[#8EA3B8]">
                          默认状态：{item.defaultStatus}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })
          : null}
      </main>
    </div>
  );
}
