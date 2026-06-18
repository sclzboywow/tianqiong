"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  DoorOpen,
  Eye,
  Lock,
  Maximize2,
  Minus,
  Plus,
  ShieldAlert,
  Sparkles,
  Star,
  Users,
  ZoomIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BUILDING_STACK_UI_ORDER } from "@/data/buildingStackFloors";
import type {
  LocationNodeStatus,
  LocationRegionId,
  LocationSandtableViewData,
  SandtableLocationNode,
  SandtableRegion,
} from "@/game/locationSandtablePresentationEngine";
import { SandtableNpcList } from "./SandtableNpcList";

type FilterId = "all" | LocationNodeStatus;

type LocationSandTablePageProps = {
  data: LocationSandtableViewData;
};

const FILTERS: { id: FilterId; label: string; icon: typeof CircleDot }[] = [
  { id: "all", label: "全部", icon: CircleDot },
  { id: "recommended", label: "推荐", icon: Star },
  { id: "has_task", label: "有任务", icon: ClipboardList },
  { id: "has_event", label: "有事件", icon: ShieldAlert },
  { id: "locked", label: "锁定", icon: Lock },
  { id: "completed", label: "已完成", icon: CheckCircle2 },
];

const REGION_BORDER: Record<LocationRegionId, string> = {
  owner_hub: "border-cyan-400/40 shadow-[inset_0_0_24px_rgba(34,211,238,0.06)]",
  command_center: "border-blue-400/35 shadow-[inset_0_0_20px_rgba(59,130,246,0.06)]",
  approval_regulatory: "border-violet-400/35 shadow-[inset_0_0_20px_rgba(139,92,246,0.05)]",
  professional_service: "border-fuchsia-400/30 shadow-[inset_0_0_20px_rgba(217,70,239,0.05)]",
  construction_site: "border-sky-400/45 shadow-[inset_0_0_32px_rgba(56,189,248,0.08)]",
  opening_prep: "border-purple-400/35 shadow-[inset_0_0_20px_rgba(168,85,247,0.05)]",
};

const STATUS_LABELS: Record<LocationNodeStatus, string> = {
  recommended: "推荐地点",
  has_task: "有任务",
  has_event: "有事件",
  locked: "锁定",
  completed: "已完成",
  normal: "普通地点",
};

const MIN_ZOOM = 0.55;
const MAX_ZOOM = 1.35;
const ZOOM_STEP = 0.05;

function flattenNodes(data: LocationSandtableViewData): SandtableLocationNode[] {
  return data.regions.flatMap((region) => region.zones.flatMap((zone) => zone.nodes));
}

function nodeMatchesFilter(node: SandtableLocationNode, filter: FilterId): boolean {
  if (filter === "all") return true;
  if (filter === "recommended") return node.recommended || node.status === "recommended";
  if (filter === "locked") return node.locked || node.status === "locked";
  return node.status === filter;
}

function getRegion(data: LocationSandtableViewData, id: LocationRegionId): SandtableRegion {
  const region = data.regions.find((item) => item.id === id);
  if (!region) throw new Error(`Missing sandtable region: ${id}`);
  return region;
}

function LocationTopHud({ data }: { data: LocationSandtableViewData }) {
  return (
    <header className="shrink-0 border-b border-cyan-400/15 px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-wide text-cyan-50">协同地图</h1>
          <p className="mt-0.5 text-[11px] text-slate-500">项目全景沙盘 · 六区协同视图</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 border border-cyan-400/25 bg-cyan-950/30 px-2.5 py-1 text-cyan-100">
            <CircleDot className="size-3 text-cyan-300" />
            当前阶段：{data.currentStageName}
          </span>
          {data.recommendedNode ? (
            <span className="inline-flex max-w-[280px] items-center gap-1.5 border border-yellow-300/30 bg-yellow-500/10 px-2.5 py-1 text-yellow-100">
              <Sparkles className="size-3 shrink-0 text-yellow-300" />
              <span className="truncate whitespace-nowrap">推荐：{data.recommendedNode.name}</span>
            </span>
          ) : null}
          <span className="inline-flex items-center gap-2 border border-emerald-400/20 bg-emerald-950/30 px-2.5 py-1 text-emerald-100">
            解锁 {data.unlockProgress}%
            <span className="h-1 w-16 overflow-hidden bg-slate-800">
              <span className="block h-full bg-cyan-400" style={{ width: `${data.unlockProgress}%` }} />
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}

function MapNodePill({
  node,
  active,
  dimmed,
  onSelect,
  wide = false,
}: {
  node: SandtableLocationNode;
  active: boolean;
  dimmed: boolean;
  onSelect: (node: SandtableLocationNode) => void;
  wide?: boolean;
}) {
  const isRecommended = node.status === "recommended";
  const isLocked = node.status === "locked";
  const isCompleted = node.status === "completed";
  const hasTask = node.status === "has_task";
  const hasEvent = node.status === "has_event";

  return (
    <button
      type="button"
      title={node.name}
      onClick={() => onSelect(node)}
      className={cn(
        "inline-flex h-7 max-w-full shrink-0 items-center gap-1.5 border px-2 text-[11px] transition",
        "focus:outline-none focus:ring-1 focus:ring-cyan-400/60",
        wide ? "w-full min-w-0" : "min-w-[88px]",
        isRecommended &&
          "border-yellow-400/60 bg-yellow-400/10 font-medium text-yellow-50 shadow-[0_0_12px_rgba(250,204,21,0.2)]",
        hasTask && !isRecommended && "border-amber-400/40 bg-amber-400/10 text-amber-100",
        hasEvent && !isRecommended && "border-rose-400/40 bg-rose-400/10 text-rose-100",
        isCompleted && !isRecommended && "border-emerald-400/35 bg-emerald-400/10 text-emerald-100",
        isLocked && "border-slate-600/40 bg-slate-900/60 text-slate-500",
        node.status === "normal" && !active && "border-cyan-400/20 bg-slate-950/70 text-slate-300",
        active && "border-cyan-300 bg-cyan-400/15 text-cyan-50 ring-1 ring-cyan-300/50",
        dimmed && "opacity-20",
      )}
    >
      {isRecommended ? <Star className="size-3 shrink-0 fill-yellow-300 text-yellow-300" /> : null}
      {hasTask && !isRecommended ? (
        <span className="size-1.5 shrink-0 rounded-full bg-amber-300" />
      ) : null}
      {hasEvent && !isRecommended ? (
        <span className="size-1.5 shrink-0 rounded-full bg-rose-400" />
      ) : null}
      {isCompleted && !isRecommended ? <CheckCircle2 className="size-3 shrink-0 text-emerald-300" /> : null}
      {isLocked ? <Lock className="size-3 shrink-0" /> : null}
      <span className="min-w-0 truncate whitespace-nowrap">{node.name}</span>
      {active ? (
        <span className="shrink-0 border border-cyan-300/40 px-1 text-[9px] text-cyan-200">当前</span>
      ) : null}
    </button>
  );
}

function MapZoneGroup({
  label,
  nodes,
  selectedId,
  filter,
  onSelect,
  layout = "wrap",
}: {
  label: string;
  nodes: SandtableLocationNode[];
  selectedId?: string;
  filter: FilterId;
  onSelect: (node: SandtableLocationNode) => void;
  layout?: "wrap" | "stack";
}) {
  if (nodes.length === 0) return null;

  return (
    <div>
      <p className="mb-1 truncate whitespace-nowrap text-[10px] text-slate-500">{label}</p>
      <div className={cn("gap-1", layout === "stack" ? "flex flex-col" : "flex flex-wrap")}>
        {nodes.map((node) => (
          <MapNodePill
            key={node.id}
            node={node}
            active={node.id === selectedId}
            dimmed={!nodeMatchesFilter(node, filter)}
            onSelect={onSelect}
            wide={layout === "stack"}
          />
        ))}
      </div>
    </div>
  );
}

function MapRegionFrame({
  region,
  selectedId,
  filter,
  onSelect,
  children,
  className,
}: {
  region: SandtableRegion;
  selectedId?: string;
  filter: FilterId;
  onSelect: (node: SandtableLocationNode) => void;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative border bg-[rgba(2,8,18,0.55)] p-3 pt-4",
        REGION_BORDER[region.id],
        !region.unlocked && "opacity-75",
        className,
      )}
    >
      <div className="absolute -top-2.5 left-3 flex items-center gap-2 bg-[#050B14] px-1.5">
        <h2 className="text-xs font-semibold text-cyan-50">{region.name}</h2>
        {region.active ? <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#67e8f9]" /> : null}
      </div>
      {children ?? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {region.zones.map((zone) => (
            <MapZoneGroup
              key={zone.id}
              label={zone.name}
              nodes={zone.nodes}
              selectedId={selectedId}
              filter={filter}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function OwnerHubMap({ region, selectedId, filter, onSelect }: RegionMapProps) {
  return (
    <MapRegionFrame region={region} selectedId={selectedId} filter={filter} onSelect={onSelect}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-4">
        {region.zones.map((zone) => (
          <MapZoneGroup
            key={zone.id}
            label={zone.name}
            nodes={zone.nodes}
            selectedId={selectedId}
            filter={filter}
            onSelect={onSelect}
          />
        ))}
      </div>
    </MapRegionFrame>
  );
}

type RegionMapProps = {
  region: SandtableRegion;
  selectedId?: string;
  filter: FilterId;
  onSelect: (node: SandtableLocationNode) => void;
};

function ConstructionSiteMap({ region, selectedId, filter, onSelect }: RegionMapProps) {
  const stackZone = region.zones.find((zone) => zone.id === "site_building_stack");
  const sideZones = region.zones.filter((zone) => zone.id !== "site_building_stack");
  const stackNodes = [...(stackZone?.nodes || [])].sort((a, b) => {
    const aIndex = BUILDING_STACK_UI_ORDER.indexOf(a.id);
    const bIndex = BUILDING_STACK_UI_ORDER.indexOf(b.id);
    if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
    if (aIndex >= 0) return -1;
    if (bIndex >= 0) return 1;
    return a.name.localeCompare(b.name, "zh-CN");
  });

  return (
    <MapRegionFrame region={region} selectedId={selectedId} filter={filter} onSelect={onSelect}>
      <div className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)_minmax(0,11rem)] gap-2">
        <div className="min-w-0 space-y-1.5">
          {sideZones.slice(0, 3).map((zone) => (
            <MapZoneGroup
              key={zone.id}
              label={zone.name}
              nodes={zone.nodes}
              selectedId={selectedId}
              filter={filter}
              onSelect={onSelect}
              layout="stack"
            />
          ))}
        </div>

        <div className="relative min-w-0 border border-cyan-400/30 bg-[linear-gradient(180deg,rgba(8,47,73,0.35),rgba(2,6,23,0.8))] px-2 py-2">
          <div className="pointer-events-none absolute inset-x-4 top-3 bottom-3 border border-dashed border-cyan-400/20" />
          <p className="relative mb-2 text-center text-[10px] font-medium text-cyan-200">楼栋垂直空间</p>
          <div className="relative flex w-full flex-col gap-0.5">
            {stackNodes.map((node) => (
              <MapNodePill
                key={node.id}
                node={node}
                active={node.id === selectedId}
                dimmed={!nodeMatchesFilter(node, filter)}
                onSelect={onSelect}
                wide
              />
            ))}
          </div>
        </div>

        <div className="min-w-0 space-y-1.5">
          {sideZones.slice(3).map((zone) => (
            <MapZoneGroup
              key={zone.id}
              label={zone.name}
              nodes={zone.nodes}
              selectedId={selectedId}
              filter={filter}
              onSelect={onSelect}
              layout="stack"
            />
          ))}
        </div>
      </div>
    </MapRegionFrame>
  );
}

function MapBlueprint({
  data,
  selectedId,
  filter,
  onSelect,
}: {
  data: LocationSandtableViewData;
  selectedId?: string;
  filter: FilterId;
  onSelect: (node: SandtableLocationNode) => void;
}) {
  const regionProps = { selectedId, filter, onSelect };

  return (
    <div className="w-[1280px] space-y-3 pb-4">
      <div className="mx-auto max-w-[960px]">
        <OwnerHubMap region={getRegion(data, "owner_hub")} {...regionProps} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MapRegionFrame region={getRegion(data, "approval_regulatory")} {...regionProps} />
        <MapRegionFrame region={getRegion(data, "command_center")} {...regionProps} />
        <MapRegionFrame region={getRegion(data, "professional_service")} {...regionProps} />
      </div>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)]">
        <ConstructionSiteMap region={getRegion(data, "construction_site")} {...regionProps} />
        <MapRegionFrame region={getRegion(data, "opening_prep")} {...regionProps} />
      </div>
    </div>
  );
}

function ZoomableMapViewport({
  data,
  selectedId,
  filter,
  onSelect,
  zoom,
  pan,
  onPanChange,
  onWheelZoom,
}: {
  data: LocationSandtableViewData;
  selectedId?: string;
  filter: FilterId;
  onSelect: (node: SandtableLocationNode) => void;
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  onWheelZoom: (delta: number) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();
      if (event.ctrlKey || event.metaKey) {
        onWheelZoom(event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
        return;
      }
      onPanChange((prev) => ({
        x: prev.x - event.deltaX,
        y: prev.y - event.deltaY,
      }));
    },
    [onPanChange, onWheelZoom],
  );

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, label")) return;

    draggingRef.current = true;
    setIsDragging(true);
    lastPointRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      const dx = event.clientX - lastPointRef.current.x;
      const dy = event.clientY - lastPointRef.current.y;
      lastPointRef.current = { x: event.clientX, y: event.clientY };
      onPanChange((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    },
    [onPanChange],
  );

  const stopDragging = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  return (
    <div
      ref={viewportRef}
      className="relative min-h-0 flex-1 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.12),transparent_55%),linear-gradient(rgba(14,165,233,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.04)_1px,transparent_1px)] bg-[size:24px_24px] touch-none select-none"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <div
        className="absolute left-0 top-0 will-change-transform"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        <div className="p-8">
          <MapBlueprint data={data} selectedId={selectedId} filter={filter} onSelect={onSelect} />
        </div>
      </div>
      <p className="pointer-events-none absolute bottom-2 left-3 text-[10px] text-slate-600">
        拖动画布平移 · Ctrl+滚轮缩放
      </p>
    </div>
  );
}

function MapControlBar({
  activeFilter,
  onFilterChange,
  zoom,
  onZoomChange,
  onResetZoom,
  onFullscreen,
}: {
  activeFilter: FilterId;
  onFilterChange: (filter: FilterId) => void;
  zoom: number;
  onZoomChange: (value: number) => void;
  onResetZoom: () => void;
  onFullscreen: () => void;
}) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-cyan-400/15 px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((filter) => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                "inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] transition",
                activeFilter === filter.id
                  ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-50"
                  : "border-cyan-400/15 bg-transparent text-slate-500 hover:text-cyan-100",
              )}
            >
              <Icon className="size-3" />
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <ZoomIn className="size-3.5 text-cyan-400" />
        <button
          type="button"
          aria-label="缩小"
          onClick={() => onZoomChange(zoom - ZOOM_STEP)}
          className="inline-flex size-7 items-center justify-center border border-cyan-400/20 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-100"
        >
          <Minus className="size-3.5" />
        </button>
        <input
          type="range"
          min={MIN_ZOOM * 100}
          max={MAX_ZOOM * 100}
          step={5}
          value={zoomPercent}
          onChange={(event) => onZoomChange(Number(event.target.value) / 100)}
          className="h-1 w-24 accent-cyan-400"
          aria-label="地图缩放"
        />
        <button
          type="button"
          aria-label="放大"
          onClick={() => onZoomChange(zoom + ZOOM_STEP)}
          className="inline-flex size-7 items-center justify-center border border-cyan-400/20 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-100"
        >
          <Plus className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onResetZoom}
          className="min-w-[42px] border border-cyan-400/20 px-2 py-1 tabular-nums text-cyan-100 hover:border-cyan-400/40"
        >
          {zoomPercent}%
        </button>
        <button
          type="button"
          onClick={onFullscreen}
          className="inline-flex size-7 items-center justify-center border border-cyan-400/20 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-100"
          aria-label="全屏"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>
    </footer>
  );
}

function LocationDetailPanel({
  node,
  regionName,
  zoneName,
}: {
  node?: SandtableLocationNode;
  regionName?: string;
  zoneName?: string;
}) {
  if (!node) {
    return (
      <aside className="flex h-full w-full flex-col border-l border-cyan-400/15 bg-[#060d18]/90 p-4 text-sm text-slate-500">
        点击地图上的地点查看详情
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto border-l border-cyan-400/20 bg-[#060d18]/95 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate whitespace-nowrap text-[11px] text-slate-500">
            {regionName} / {zoneName}
          </p>
          <h2 className="mt-1 truncate whitespace-nowrap text-base font-semibold text-cyan-50">
            {node.name}
          </h2>
        </div>
        <span
          className={cn(
            "shrink-0 border px-2 py-0.5 text-[10px] whitespace-nowrap",
            node.status === "recommended" && "border-yellow-400/40 text-yellow-100",
            node.status === "has_task" && "border-amber-400/40 text-amber-100",
            node.status === "has_event" && "border-rose-400/40 text-rose-100",
            node.status === "completed" && "border-emerald-400/40 text-emerald-100",
            node.status === "locked" && "border-slate-600/30 text-slate-500",
            node.status === "normal" && "border-cyan-400/25 text-cyan-100",
          )}
        >
          {STATUS_LABELS[node.status]}
        </span>
      </div>

      {node.description ? (
        <p className="mt-3 border border-cyan-400/10 bg-slate-950/50 p-3 text-[13px] leading-6 text-slate-300">
          {node.description}
        </p>
      ) : null}

      <DetailSection icon={Users} title="相关 NPC">
        <SandtableNpcList npcs={node.relatedNpcs} />
      </DetailSection>

      <DetailSection icon={DoorOpen} title="可执行行动">
        <TokenList
          items={
            node.locked
              ? ["等待解锁"]
              : node.availableActionLabels?.length
                ? node.availableActionLabels
                : ["现场查看", "同步信息", "发起协同"]
          }
          empty="暂无行动"
        />
      </DetailSection>

      <DetailSection icon={ClipboardList} title="相关任务">
        <TokenList
          items={node.relatedTaskTitles?.length ? node.relatedTaskTitles : node.relatedTaskSlugs}
          empty="暂无任务"
        />
      </DetailSection>

      <DetailSection icon={AlertTriangle} title="影响指标">
        <TokenList items={node.impactLabels?.length ? node.impactLabels : node.riskTags} empty="暂无风险标签" />
      </DetailSection>

      <div className="mt-auto space-y-2 pt-4">
        {node.canEnter && node.href && !node.locked ? (
          <Link
            href={node.href}
            className="flex h-10 items-center justify-center gap-2 bg-cyan-400 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
          >
            <DoorOpen className="size-4" />
            进入地点
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="flex h-10 w-full items-center justify-center gap-2 bg-slate-800 text-sm text-slate-500"
          >
            <Lock className="size-4" />
            进入地点
          </button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/tasks"
            className="flex h-9 items-center justify-center gap-1.5 border border-cyan-400/20 text-xs text-cyan-100 hover:border-cyan-400/40"
          >
            <ClipboardList className="size-3.5" />
            查看任务
          </Link>
          <button
            type="button"
            className="flex h-9 items-center justify-center gap-1.5 border border-cyan-400/20 text-xs text-cyan-100 hover:border-cyan-400/40"
          >
            <Eye className="size-3.5" />
            设为关注
          </button>
        </div>
      </div>
    </aside>
  );
}

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Users;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-medium text-cyan-100">
        <Icon className="size-3.5 text-cyan-400" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function TokenList({ items, empty }: { items?: string[]; empty: string }) {
  const normalized = (items || []).filter(Boolean);
  if (normalized.length === 0) return <p className="text-[11px] text-slate-600">{empty}</p>;

  return (
    <div className="flex flex-wrap gap-1">
      {normalized.map((item) => (
        <span
          key={item}
          className="max-w-full truncate whitespace-nowrap border border-cyan-400/15 bg-slate-950/60 px-2 py-0.5 text-[11px] text-slate-400"
          title={item}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function LocationSandTablePage({ data }: LocationSandTablePageProps) {
  const shellRef = useRef<HTMLElement>(null);
  const nodes = useMemo(() => flattenNodes(data), [data]);
  const defaultNodeId = data.recommendedNode?.id || nodes.find((node) => !node.locked)?.id;
  const [selectedId, setSelectedId] = useState(defaultNodeId);
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const selectedNode = nodes.find((node) => node.id === selectedId) || data.recommendedNode;
  const selectedRegion = data.regions.find((region) =>
    region.zones.some((zone) => zone.nodes.some((node) => node.id === selectedNode?.id)),
  );
  const selectedZone = selectedRegion?.zones.find((zone) =>
    zone.nodes.some((node) => node.id === selectedNode?.id),
  );

  const clampZoom = useCallback((value: number) => {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
  }, []);

  const handleZoomChange = useCallback(
    (value: number) => {
      setZoom(clampZoom(value));
    },
    [clampZoom],
  );

  const handleWheelZoom = useCallback(
    (delta: number) => {
      setZoom((current) => clampZoom(current + delta));
    },
    [clampZoom],
  );

  const handleFullscreen = useCallback(() => {
    const element = shellRef.current;
    if (!element) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void element.requestFullscreen?.();
  }, []);

  return (
    <section
      ref={shellRef}
      className="flex h-[min(860px,calc(100vh-140px))] flex-col overflow-hidden border border-cyan-400/20 bg-[#050B14]"
    >
      <LocationTopHud data={data} />

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <ZoomableMapViewport
            data={data}
            selectedId={selectedNode?.id}
            filter={activeFilter}
            onSelect={(node) => setSelectedId(node.id)}
            zoom={zoom}
            pan={pan}
            onPanChange={setPan}
            onWheelZoom={handleWheelZoom}
          />
          <MapControlBar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            zoom={zoom}
            onZoomChange={handleZoomChange}
            onResetZoom={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            onFullscreen={handleFullscreen}
          />
        </div>

        <div className="hidden w-[340px] shrink-0 lg:block">
          <LocationDetailPanel
            node={selectedNode}
            regionName={selectedRegion?.name}
            zoneName={selectedZone?.name}
          />
        </div>
      </div>

      {selectedNode ? (
        <div className="border-t border-cyan-400/15 p-3 lg:hidden">
          <LocationDetailPanel
            node={selectedNode}
            regionName={selectedRegion?.name}
            zoneName={selectedZone?.name}
          />
        </div>
      ) : null}
    </section>
  );
}
