"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { STAGE_IDS, TAB_ENDPOINTS, TABS } from "./contentOrchestration/types";

const STAGE_LABELS: Record<string, string> = {
  INITIATION: "项目启动",
  APPROVAL: "报批报建",
  DESIGN: "设计阶段",
  PROCUREMENT: "招采阶段",
  CONSTRUCTION: "施工阶段",
};

const CLIENT_REQUEST_TIMEOUT_MS = 18_000;

export function ContentOrchestrationPanel({
  initialOverview,
  initialTab = "overview",
  initialTabData = {},
}: ContentOrchestrationPanelProps) {
  const [tab, setTab] = useState<TabId>(initialTab);
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [overview, setOverview] =
    useState<ContentOrchestrationOverview>(initialOverview);
  const [tabData, setTabData] = useState<Partial<TabDataMap>>(initialTabData);
  const [loadingTabs, setLoadingTabs] = useState<
    Partial<Record<Exclude<TabId, "overview">, boolean>>
  >({});
  const [errorTab, setErrorTab] = useState<Partial<Record<TabId, string>>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [selection, setSelection] = useState<InspectorSelection>(null);
  const activeRequests = useRef<
    Partial<Record<Exclude<TabId, "overview">, AbortController>>
  >({});

  const fetchTab = useCallback(
    async <T extends Exclude<TabId, "overview">>(
      tabId: T,
      refresh = false,
      signal?: AbortSignal,
    ): Promise<TabDataMap[T] | null> => {
      const query = refresh ? "?refresh=1" : "";
      const res = await fetch(`${TAB_ENDPOINTS[tabId]}${query}`, { signal });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || `加载失败 (${res.status})`);
      }
      return (await res.json()) as TabDataMap[T];
    },
    [],
  );

  const loadTab = useCallback(
    async (tabId: Exclude<TabId, "overview">, refresh = false) => {
      activeRequests.current[tabId]?.abort("superseded");
      const controller = new AbortController();
      activeRequests.current[tabId] = controller;
      const timeout = window.setTimeout(
        () => controller.abort("timeout"),
        CLIENT_REQUEST_TIMEOUT_MS,
      );

      setLoadingTabs((prev) => ({ ...prev, [tabId]: true }));
      setErrorTab((prev) => ({ ...prev, [tabId]: undefined }));
      try {
        const data = await fetchTab(tabId, refresh, controller.signal);
        if (data) {
          setTabData((prev) => ({ ...prev, [tabId]: data }));
        }
      } catch (error) {
        if (controller.signal.aborted && controller.signal.reason !== "timeout")
          return;
        const message =
          controller.signal.reason === "timeout"
            ? "加载超时。请重试；若持续发生，请检查 Payload 数据库状态。"
            : error instanceof Error
              ? error.message
              : "加载失败";
        setErrorTab((prev) => ({
          ...prev,
          [tabId]: message,
        }));
      } finally {
        window.clearTimeout(timeout);
        if (activeRequests.current[tabId] === controller) {
          delete activeRequests.current[tabId];
          setLoadingTabs((prev) => ({ ...prev, [tabId]: false }));
        }
      }
    },
    [fetchTab],
  );

  useEffect(() => {
    const requests = activeRequests.current;
    return () => {
      for (const controller of Object.values(requests)) {
        controller?.abort("unmount");
      }
    };
  }, []);

  function navigateTab(nextTab: TabId, nextStageFilter?: StageFilter) {
    setTab(nextTab);
    setSelection(null);
    if (
      nextTab !== "overview" &&
      !tabData[nextTab] &&
      !activeRequests.current[nextTab]
    ) {
      void loadTab(nextTab);
    }
    if (nextStageFilter != null) {
      setStageFilter(nextStageFilter);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setWorkspaceError(null);
    try {
      const overviewRes = await fetch(
        "/api/ops/content-orchestration/overview?refresh=1",
        {
          signal: AbortSignal.timeout(CLIENT_REQUEST_TIMEOUT_MS),
        },
      );
      if (!overviewRes.ok) {
        const body = (await overviewRes.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || `刷新失败 (${overviewRes.status})`);
      }
      setOverview((await overviewRes.json()) as ContentOrchestrationOverview);
      setTabData({});
      setSelection(null);
      if (tab !== "overview") {
        await loadTab(tab, true);
      }
    } catch (error) {
      setWorkspaceError(
        error instanceof DOMException && error.name === "TimeoutError"
          ? "刷新超时，请检查 Payload 数据库状态后重试。"
          : error instanceof Error
            ? error.message
            : "刷新失败",
      );
    } finally {
      setRefreshing(false);
    }
  }

  const showStageNav = tab === "tasks" || tab === "artifacts";
  const activeTabMeta = TABS.find((item) => item.id === tab);
  const loadingTab = tab !== "overview" && loadingTabs[tab] ? tab : null;

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col">
      <header className="shrink-0 space-y-3 border-b border-zinc-800 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-50">编排技术视图</h1>
            <p className="mt-0.5 text-sm text-zinc-400">
              高级排查 · 查看底层对象关系与健康检查
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/ops/project-flow"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              返回项目流程编排
            </Link>
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
          <Badge variant="outline">
            主线 {overview.overview.mainlineTaskCount}
          </Badge>
          <Badge variant="outline">
            补正 {overview.overview.correctionTaskCount}
          </Badge>
          <Badge variant="outline">
            成果物 {overview.overview.artifactCount}
          </Badge>
          <Badge
            variant={
              overview.cleanup.payloadCheckAvailable && overview.cleanup.clean
                ? "default"
                : "outline"
            }
          >
            {!overview.cleanup.payloadCheckAvailable
              ? "cleanup 检查不可用"
              : overview.cleanup.clean
                ? "旧数据已清理"
                : `旧数据 ${overview.cleanup.issueCount} 项`}
          </Badge>
          {!overview.cleanup.payloadCheckAvailable ||
          !overview.cleanup.clean ? (
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

      {workspaceError ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-rose-900/50 bg-rose-950/20 px-3 py-2 text-sm text-rose-200">
          <span>{workspaceError}</span>
          <button
            type="button"
            onClick={() => setWorkspaceError(null)}
            className="text-xs underline"
          >
            关闭
          </button>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 gap-0 pt-4">
        <nav className="hidden w-52 shrink-0 flex-col gap-4 pr-4 md:flex lg:w-56">
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wide text-zinc-500">
              对象导航
            </p>
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
              <p className="mb-2 text-[11px] uppercase tracking-wide text-zinc-500">
                阶段筛选
              </p>
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
            <h2 className="mb-4 text-sm font-medium text-zinc-300">
              {activeTabMeta.label}
            </h2>
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

        <ContentOrchestrationInspector
          selection={selection}
          onClose={() => setSelection(null)}
        />
      </div>
    </div>
  );
}
