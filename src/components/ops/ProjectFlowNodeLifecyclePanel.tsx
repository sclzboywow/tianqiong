"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LifecycleSummary = {
  tasks: number;
  actions: number;
  events: number;
  stories: number;
};

type DeleteBlocker = {
  kind: string;
  message: string;
  refs: string[];
};

type ProjectFlowNodeLifecyclePanelProps = {
  slug: string;
  title: string;
  enabled: boolean;
  variant?: "drawer" | "danger";
  onChanged?: () => void;
};

async function patchNodeEnabled(slug: string, enabled: boolean) {
  const res = await fetch(`/api/ops/project-flow/nodes/${slug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled, scope: "node" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "操作失败");
  return data as {
    ok: boolean;
    action: "disabled" | "enabled";
    summary: LifecycleSummary;
    warnings: string[];
  };
}

async function deleteNode(
  slug: string,
  confirmSlug: string,
  deleteStories: boolean,
) {
  const res = await fetch(`/api/ops/project-flow/nodes/${slug}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmSlug, deleteStories }),
  });
  const data = await res.json();
  if (!res.ok) {
    const blockers = (data.blockers || []) as DeleteBlocker[];
    const detail =
      blockers.length > 0
        ? blockers.map((item) => item.message).join("；")
        : data.error;
    throw new Error(detail || "删除失败");
  }
  return data;
}

export function ProjectFlowNodeLifecyclePanel({
  slug,
  title,
  enabled,
  variant = "drawer",
  onChanged,
}: ProjectFlowNodeLifecyclePanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"disable" | "enable" | "delete" | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState("");
  const [deleteStories, setDeleteStories] = useState(false);

  async function handleToggle(enabledNext: boolean) {
    setLoading(enabledNext ? "enable" : "disable");
    setMessage(null);
    setWarnings([]);
    try {
      const result = await patchNodeEnabled(slug, enabledNext);
      setMessage(enabledNext ? "节点已恢复" : "节点已停用");
      setWarnings(result.warnings || []);
      onChanged?.();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (confirmSlug.trim() !== slug) {
      setMessage("请输入正确的节点标识以确认删除");
      return;
    }
    setLoading("delete");
    setMessage(null);
    try {
      await deleteNode(slug, confirmSlug.trim(), deleteStories);
      setConfirmOpen(false);
      router.push("/ops/project-flow");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败");
    } finally {
      setLoading(null);
    }
  }

  const isDanger = variant === "danger";

  return (
    <div
      className={cn(
        "space-y-3",
        isDanger
          ? "rounded-xl border border-rose-900/50 bg-rose-950/10 p-5"
          : "rounded-lg border border-zinc-800 bg-zinc-950/50 p-4",
      )}
    >
      {isDanger ? (
        <>
          <div>
            <h3 className="font-medium text-rose-200">危险区</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              停用节点会让该任务、地点行动和关联事件从运营页面中隐藏，但不会删除数据，可恢复。
            </p>
          </div>
        </>
      ) : (
        <div>
          <p className="text-sm font-medium text-zinc-200">节点状态</p>
          <p className="mt-1 text-xs text-zinc-500">
            {enabled
              ? "当前节点处于启用状态，可在流程中展示与办理。"
              : "当前节点已停用，不会在流程中生成。"}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {enabled ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void handleToggle(false)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-amber-800 text-amber-200",
            )}
          >
            {loading === "disable" ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : null}
            停用流程节点
          </button>
        ) : (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void handleToggle(true)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {loading === "enable" ? (
              <Loader2 className="mr-1 size-4 animate-spin" />
            ) : null}
            恢复流程节点
          </button>
        )}
        {!isDanger ? (
          <Link
            href={`/ops/project-flow/node/${slug}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            进入节点编排
          </Link>
        ) : null}
        {isDanger ? (
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => {
              setConfirmOpen(true);
              setConfirmSlug("");
              setMessage(null);
            }}
            className={cn(
              buttonVariants({ variant: "destructive", size: "sm" }),
            )}
          >
            永久删除流程节点
          </button>
        ) : null}
      </div>

      {!enabled ? (
        <Badge variant="outline" className="border-zinc-600 text-zinc-400">
          已停用
        </Badge>
      ) : null}

      {message ? (
        <p
          className={cn(
            "text-sm",
            message.includes("失败") || message.includes("无法")
              ? "text-rose-300"
              : "text-emerald-300",
          )}
        >
          {message}
        </p>
      ) : null}

      {warnings.length > 0 ? (
        <ul className="space-y-1 text-xs text-amber-300/90">
          {warnings.map((warning) => (
            <li key={warning}>· {warning}</li>
          ))}
        </ul>
      ) : null}

      {confirmOpen ? (
        <div className="space-y-3 rounded-lg border border-rose-900/60 bg-zinc-950/80 p-4">
          <p className="text-sm text-zinc-200">
            将永久删除「{title}」及其专属地点行动、事件。
            {deleteStories ? " 关联剧情也会一并删除。" : " 剧情片段默认保留。"}
          </p>
          <p className="text-xs text-rose-300">
            若其它任务、事件或地点行动仍引用该节点，删除会被阻止。
          </p>
          <label className="flex items-center gap-2 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={deleteStories}
              onChange={(event) => setDeleteStories(event.target.checked)}
            />
            同时删除仅服务该任务的剧情片段
          </label>
          <label className="block space-y-1 text-sm text-zinc-400">
            <span>输入节点标识以确认删除</span>
            <input
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-sm text-zinc-100"
              value={confirmSlug}
              onChange={(event) => setConfirmSlug(event.target.value)}
              placeholder={slug}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading === "delete"}
              onClick={() => void handleDelete()}
              className={cn(
                buttonVariants({ variant: "destructive", size: "sm" }),
              )}
            >
              {loading === "delete" ? (
                <Loader2 className="mr-1 size-4 animate-spin" />
              ) : null}
              确认永久删除
            </button>
            <button
              type="button"
              disabled={loading === "delete"}
              onClick={() => setConfirmOpen(false)}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              取消
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
