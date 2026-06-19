"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContentOrchestrationOverview } from "@/game/contentOrchestrationLoader";
import { ContentOrchestrationInspector } from "./contentOrchestration/Inspector";
import { ContentOrchestrationWorkspaceMain } from "./contentOrchestration/WorkspaceMain";
import type {
  ContentOrchestrationPanelProps,
  InspectorSelection,
  StageFilter,
  TabDataMap,
  TabId,
} from "./contentOrchestration/types";
import {
  STAGE_IDS,
  TAB_ENDPOINTS,
  TABS,
} from "./contentOrchestration/types";

const STAGE_LABELS: Record<string, string> = {
  INITIATION: "项目启动",
  APPROVAL: "报批报建",
  DESIGN: "设计阶段",
  PROCUREMENT: "招采阶段",
  CONSTRUCTION: "施工阶段",
};

export function ContentOrchestrationPanel({ initialOverview }: ContentOrchestrationPanelProps) {
  const [tab, setTab] = useState<TabId>("overview");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [overview, setOverview] = useState<ContentOrchestrationOverview>(initialOverview);
  const [tabData, setTabData] = useState<Partial<TabDataMap>>({});
  const [loadingTab, setLoadingTab] = useState<TabId | null>(null);
  const [errorTab, setErrorTab] = useState<Partial<Record<TabId, string>>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [selection, setSelection] = useState<InspectorSelection>(null);

  const fetchTab = useCallback(async <T extends Exclude<TabId, "overview">>(
    tabId: T,
    refresh = false,
  ): Promise<TabDataMap[T] | null> => {
    const query = refresh ? "?refresh=1" : "";
    const res = await fetch(`${TAB_ENDPOINTS[tabId]}${query}`);
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error || `加载失败 (${res.status})`);
    }
    return (await res.json()) as TabDataMap[T];
  }, []);

  const loadTab = useCallback(
    async (tabId: Exclude<TabId, "overview">, refresh = false) => {
      setLoadingTab(tabId);
      setErrorTab((prev) => ({ ...prev, [tabId]: undefined }));
      try {
        const data = await fetchTab(tabId, refresh);
        if (data) {
          setTabData((prev) => ({ ...prev, [tabId]: data }));
        }
      } catch (error) {
        setErrorTab((prev) => ({
          ...prev,
          [tabId]: error instanceof Error ? error.message : "加载失败",
        }));
      } finally {
        setLoadingTab(null);
      }
    },
    [fetchTab],
  );

  useEffect(() => {
    if (tab === "overview") return;
    if (tabData[tab]) return;
    void loadTab(tab);
  }, [tab, tabData, loadTab]);

  function navigateTab(nextTab: TabId, nextStageFilter?: StageFilter) {
    setTab(nextTab);
    setSelection(null);
    if (nextStageFilter != null) {
      setStageFilter(nextStageFilter);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const overviewRes = await fetch("/api/ops/content-orchestration/overview?refresh=1");
      if (overviewRes.ok) {
        setOverview((await overviewRes.json()) as ContentOrchestrationOverview);
      }
      setTabData({});
      setSelection(null);
      if (tab !== "overview") {
        await loadTab(tab, true);
      }
    } finally {
      setRefreshing(false);
    }
  }

  const showStageNav = tab === "tasks" || tab === "artifacts";
  const activeTabMeta = TABS.find((item) => item.id === tab);

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col">
      <header className="shrink-0 space-y-3 border-b border-zinc-800 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-50">项目主线编排</h1>
            <p className="mt-0.5 text-sm text-zinc-400">编排工作台 · 配置态串联主线对象</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              {refreshing ? "刷新中..." : "刷新数据"}
            </button>
            <Link
              href="/ops/content-studio"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              内容编排台
            </Link>
            <Link
              href="/ops/content-studio?tab=mainline"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              主线调试
            </Link>
            <a
              href="/admin"
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Payload 后台
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline">主线 {overview.overview.mainlineTaskCount}</Badge>
          <Badge variant="outline">补正 {overview.overview.correctionTaskCount}</Badge>
          <Badge variant="outline">成果物 {overview.overview.artifactCount}</Badge>
          <Badge
            variant={
              overview.cleanup.payloadCheckAvailable && overview.cleanup.clean ? "default" : "outline"
            }
          >
            {!overview.cleanup.payloadCheckAvailable
              ? "cleanup 检查不可用"
              : overview.cleanup.clean
                ? "旧数据已清理"
                : `旧数据 ${overview.cleanup.issueCount} 项`}
          </Badge>
          {!overview.cleanup.payloadCheckAvailable || !overview.cleanup.clean ? (
            <button
              type="button"
              onClick={() => navigateTab("cleanup")}
              className="text-amber-300 underline-offset-2 hover:underline"
            >
              查看清理
            </button>
          ) : null}
          {loadingTab ? (
            <span className="text-zinc-500">加载 {loadingTab}...</span>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-0 pt-4">
        <nav className="hidden w-52 shrink-0 flex-col gap-4 pr-4 md:flex lg:w-56">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wide text-zinc-500">对象导航</p>
            <ul className="space-y-1">
              {TABS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => navigateTab(item.id)}
                    className={cn(
                      "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                      tab === item.id
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200",
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {showStageNav ? (
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wide text-zinc-500">阶段筛选</p>
              <ul className="space-y-1">
                <li>
                  <button
                    type="button"
                    onClick={() => setStageFilter("all")}
                    className={cn(
                      "w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors",
                      stageFilter === "all"
                        ? "bg-sky-950/40 text-sky-200"
                        : "text-zinc-500 hover:text-zinc-300",
                    )}
                  >
                    全部阶段
                  </button>
                </li>
                {STAGE_IDS.map((stageId) => (
                  <li key={stageId}>
                    <button
                      type="button"
                      onClick={() => setStageFilter(stageId)}
                      className={cn(
                        "w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors",
                        stageFilter === stageId
                          ? "bg-sky-950/40 text-sky-200"
                          : "text-zinc-500 hover:text-zinc-300",
                      )}
                    >
                      {STAGE_LABELS[stageId] || stageId}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </nav>

        <main className="min-w-0 flex-1 overflow-y-auto pr-2">
          <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTab(item.id)}
                className={cn(
                  buttonVariants({
                    variant: tab === item.id ? "default" : "outline",
                    size: "sm",
                  }),
                  "shrink-0 text-xs",
                )}
              >
                {item.short}
              </button>
            ))}
          </div>

          {activeTabMeta ? (
            <h2 className="mb-4 text-sm font-medium text-zinc-300">{activeTabMeta.label}</h2>
          ) : null}

          <ContentOrchestrationWorkspaceMain
            tab={tab}
            stageFilter={stageFilter}
            overview={overview}
            tasksData={tabData.tasks}
            artifactsData={tabData.artifacts}
            actionsData={tabData.actions}
            eventsData={tabData.events}
            storiesData={tabData.stories}
            cleanupData={tabData.cleanup}
            healthData={tabData.health}
            loadingTab={loadingTab}
            errorTab={errorTab}
            selection={selection}
            onSelect={setSelection}
            onRetry={(tabId) => void loadTab(tabId, true)}
            onNavigateTab={navigateTab}
          />
        </main>

        <ContentOrchestrationInspector selection={selection} onClose={() => setSelection(null)} />
      </div>
    </div>
  );
}
