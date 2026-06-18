"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  DoorOpen,
  Eye,
  Lock,
  ShieldAlert,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  LocationNodeStatus,
  LocationRegionId,
  LocationSandtableViewData,
  SandtableLocationNode,
  SandtableRegion,
} from "@/game/locationSandtablePresentationEngine";

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

const REGION_CLASS: Record<LocationRegionId, string> = {
  owner_hub: "border-cyan-400/35 bg-cyan-950/35",
  command_center: "border-blue-400/35 bg-blue-950/35",
  approval_regulatory: "border-violet-400/35 bg-violet-950/30",
  professional_service: "border-fuchsia-400/35 bg-fuchsia-950/25",
  construction_site: "border-sky-400/45 bg-sky-950/30",
  opening_prep: "border-purple-400/35 bg-purple-950/25",
};

const STATUS_LABELS: Record<LocationNodeStatus, string> = {
  recommended: "推荐地点",
  has_task: "有任务",
  has_event: "有事件",
  locked: "锁定",
  completed: "已完成",
  normal: "普通地点",
};

const FLOOR_STACK_ORDER = [
  "site_roof_floor",
  "site_equipment_floor",
  "site_standard_floor",
  "site_floor_3f",
  "site_floor_2f",
  "site_l1_commercial_street",
  "site_b1_mep_corridor",
  "site_b2_basement",
];

function flattenNodes(data: LocationSandtableViewData): SandtableLocationNode[] {
  return data.regions.flatMap((region) => region.zones.flatMap((zone) => zone.nodes));
}

function nodeMatchesFilter(node: SandtableLocationNode, filter: FilterId): boolean {
  if (filter === "all") return true;
  if (filter === "recommended") return node.recommended || node.status === "recommended";
  if (filter === "locked") return node.locked || node.status === "locked";
  return node.status === filter;
}

function LocationTopHud({ data }: { data: LocationSandtableViewData }) {
  return (
    <header className="flex flex-col gap-3 border-b border-sky-400/15 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-normal text-sky-50">协同地图</h1>
        <p className="mt-1 text-xs text-slate-400">项目全景沙盘 · 六区协同视图</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-2 rounded-md border border-sky-400/20 bg-sky-950/40 px-3 py-1.5 text-sky-100">
          <CircleDot className="size-3.5 text-sky-300" />
          当前阶段：{data.currentStageName}
        </span>
        {data.recommendedNode ? (
          <span className="inline-flex items-center gap-2 rounded-md border border-yellow-300/25 bg-yellow-500/10 px-3 py-1.5 text-yellow-100">
            <Sparkles className="size-3.5 text-yellow-300" />
            推荐地点：{data.recommendedNode.shortName}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-2 rounded-md border border-emerald-300/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-100">
          解锁进度：{data.unlockProgress}%
          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
            <span
              className="block h-full rounded-full bg-cyan-300"
              style={{ width: `${data.unlockProgress}%` }}
            />
          </span>
        </span>
      </div>
    </header>
  );
}

function LocationNodeButton({
  node,
  active,
  dimmed,
  onSelect,
  compact = false,
}: {
  node: SandtableLocationNode;
  active: boolean;
  dimmed: boolean;
  onSelect: (node: SandtableLocationNode) => void;
  compact?: boolean;
}) {
  const isRecommended = node.status === "recommended";
  const isLocked = node.status === "locked";
  const isCompleted = node.status === "completed";
  const hasTask = node.status === "has_task";
  const hasEvent = node.status === "has_event";
  const label = isRecommended ? node.name : node.shortName;

  return (
    <button
      type="button"
      title={node.name}
      onClick={() => onSelect(node)}
      className={cn(
        "group relative inline-flex min-h-7 items-center justify-center gap-1.5 rounded-md border px-1.5 text-xs transition",
        "focus:outline-none focus:ring-2 focus:ring-sky-300/50",
        compact ? "w-full" : "max-w-full",
        isRecommended &&
          "border-yellow-300/70 bg-yellow-300/15 px-2 font-semibold text-yellow-50 shadow-[0_0_16px_rgba(250,204,21,0.26)]",
        hasTask && "border-amber-300/35 bg-amber-400/10 text-amber-100",
        hasEvent && "border-rose-300/35 bg-rose-400/10 text-rose-100",
        isCompleted && "border-emerald-300/35 bg-emerald-400/10 text-emerald-100",
        isLocked && "border-slate-500/20 bg-slate-800/45 text-slate-500 grayscale",
        node.status === "normal" && "border-sky-300/20 bg-slate-950/50 text-slate-300",
        active && "ring-2 ring-sky-300/70",
        dimmed && "opacity-25",
      )}
    >
      {isRecommended ? <Star className="size-3.5 fill-yellow-300 text-yellow-300" /> : null}
      {hasTask ? <span className="size-2 rounded-full bg-amber-300 shadow-[0_0_8px_#f59e0b]" /> : null}
      {hasEvent ? <span className="size-2 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185]" /> : null}
      {isCompleted ? <CheckCircle2 className="size-3.5 text-emerald-300" /> : null}
      {isLocked ? <Lock className="size-3.5" /> : null}
      <span className={cn("truncate", isRecommended ? "max-w-[170px]" : "max-w-[64px]")}>
        {label}
      </span>
      {node.status === "normal" ? (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-sky-300/20 bg-slate-950 px-2 py-1 text-[11px] text-sky-50 shadow-xl group-hover:block">
          {node.name}
        </span>
      ) : null}
    </button>
  );
}

function RegionPanel({
  region,
  selectedId,
  filter,
  onSelect,
  large = false,
  children,
}: {
  region: SandtableRegion;
  selectedId?: string;
  filter: FilterId;
  onSelect: (node: SandtableLocationNode) => void;
  large?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative rounded-lg border p-2.5 shadow-[0_0_22px_rgba(14,165,233,0.08)]",
        REGION_CLASS[region.id],
        large ? "min-h-[285px]" : "min-h-[108px]",
        !region.unlocked && "opacity-80",
      )}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-sky-50">{region.name}</h2>
          <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-slate-400">
            {region.description}
          </p>
        </div>
        {region.active ? (
          <span className="mt-1 size-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" />
        ) : null}
      </div>
      {children ?? (
        <div className="grid grid-cols-2 gap-1.5">
          {region.zones.map((zone) => (
            <div key={zone.id} className="rounded-md border border-sky-300/10 bg-slate-950/35 p-1.5">
              <div className="mb-1 text-[10px] text-slate-400">{zone.name}</div>
              <div className="flex flex-wrap gap-1">
                {zone.nodes.map((node) => (
                  <LocationNodeButton
                    key={node.id}
                    node={node}
                    active={node.id === selectedId}
                    dimmed={!nodeMatchesFilter(node, filter)}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function getRegion(data: LocationSandtableViewData, id: LocationRegionId): SandtableRegion {
  const region = data.regions.find((item) => item.id === id);
  if (!region) throw new Error(`Missing sandtable region: ${id}`);
  return region;
}

function StandardRegion(props: {
  region: SandtableRegion;
  selectedId?: string;
  filter: FilterId;
  onSelect: (node: SandtableLocationNode) => void;
}) {
  return <RegionPanel {...props} />;
}

function OwnerHubRegion(props: {
  region: SandtableRegion;
  selectedId?: string;
  filter: FilterId;
  onSelect: (node: SandtableLocationNode) => void;
}) {
  const { region, selectedId, filter, onSelect } = props;
  return (
    <RegionPanel region={region} selectedId={selectedId} filter={filter} onSelect={onSelect}>
      <div className="grid grid-cols-4 gap-1.5">
        {region.zones.map((zone) => (
          <div key={zone.id} className="rounded-md border border-sky-300/10 bg-slate-950/35 p-1.5">
            <div className="mb-1 text-[10px] text-slate-400">{zone.name}</div>
            <div className="flex flex-wrap gap-1">
              {zone.nodes.map((node) => (
                <LocationNodeButton
                  key={node.id}
                  node={node}
                  active={node.id === selectedId}
                  dimmed={!nodeMatchesFilter(node, filter)}
                  onSelect={onSelect}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </RegionPanel>
  );
}

function CommandRegion(props: {
  region: SandtableRegion;
  selectedId?: string;
  filter: FilterId;
  onSelect: (node: SandtableLocationNode) => void;
}) {
  return <StandardRegion {...props} />;
}

function ApprovalRegion(props: {
  region: SandtableRegion;
  selectedId?: string;
  filter: FilterId;
  onSelect: (node: SandtableLocationNode) => void;
}) {
  return <StandardRegion {...props} />;
}

function ProfessionalRegion(props: {
  region: SandtableRegion;
  selectedId?: string;
  filter: FilterId;
  onSelect: (node: SandtableLocationNode) => void;
}) {
  return <StandardRegion {...props} />;
}

function OpeningPrepRegion(props: {
  region: SandtableRegion;
  selectedId?: string;
  filter: FilterId;
  onSelect: (node: SandtableLocationNode) => void;
}) {
  return <StandardRegion {...props} />;
}

function ConstructionSiteRegion({
  region,
  selectedId,
  filter,
  onSelect,
}: {
  region: SandtableRegion;
  selectedId?: string;
  filter: FilterId;
  onSelect: (node: SandtableLocationNode) => void;
}) {
  const stackZone = region.zones.find((zone) => zone.id === "site_building_stack");
  const sideZones = region.zones.filter((zone) => zone.id !== "site_building_stack");
  const stackNodes = [...(stackZone?.nodes || [])].sort((a, b) => {
    const aIndex = FLOOR_STACK_ORDER.indexOf(a.id);
    const bIndex = FLOOR_STACK_ORDER.indexOf(b.id);
    if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
    if (aIndex >= 0) return -1;
    if (bIndex >= 0) return 1;
    return a.shortName.localeCompare(b.shortName, "zh-CN");
  });

  return (
    <RegionPanel region={region} selectedId={selectedId} filter={filter} onSelect={onSelect} large>
      <div className="grid gap-3 lg:grid-cols-[1fr_220px_1fr]">
        <div className="grid gap-2">
          {sideZones.slice(0, 3).map((zone) => (
            <ConstructionZone
              key={zone.id}
              zone={zone}
              selectedId={selectedId}
              filter={filter}
              onSelect={onSelect}
            />
          ))}
        </div>

        <div className="rounded-lg border border-cyan-300/25 bg-slate-950/45 p-2 shadow-[inset_0_0_22px_rgba(56,189,248,0.12)]">
          <div className="mb-2 text-center text-xs font-medium text-cyan-100">楼栋垂直空间</div>
          <div className="grid gap-1">
            {stackNodes.map((node) => (
              <LocationNodeButton
                key={node.id}
                node={node}
                active={node.id === selectedId}
                dimmed={!nodeMatchesFilter(node, filter)}
                onSelect={onSelect}
                compact
              />
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          {sideZones.slice(3).map((zone) => (
            <ConstructionZone
              key={zone.id}
              zone={zone}
              selectedId={selectedId}
              filter={filter}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </RegionPanel>
  );
}

function ConstructionZone({
  zone,
  selectedId,
  filter,
  onSelect,
}: {
  zone: SandtableRegion["zones"][number];
  selectedId?: string;
  filter: FilterId;
  onSelect: (node: SandtableLocationNode) => void;
}) {
  return (
    <div className="min-h-[58px] rounded-md border border-sky-300/10 bg-slate-950/35 p-1.5">
      <div className="mb-1 text-[10px] text-slate-400">{zone.name}</div>
      <div className="flex flex-wrap gap-1">
        {zone.nodes.map((node) => (
          <LocationNodeButton
            key={node.id}
            node={node}
            active={node.id === selectedId}
            dimmed={!nodeMatchesFilter(node, filter)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function LocationMapCanvas({
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
  return (
    <div className="overflow-x-auto">
      <div className="relative min-w-[980px] p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.16),transparent_42%)]" />
        <div className="relative grid grid-cols-3 grid-rows-[auto_auto_auto_auto] gap-3">
          <div className="col-span-3 mx-auto w-[620px] max-w-full">
            <OwnerHubRegion
              region={getRegion(data, "owner_hub")}
              selectedId={selectedId}
              filter={filter}
              onSelect={onSelect}
            />
          </div>

          <div className="col-start-1 row-start-2">
            <ApprovalRegion
              region={getRegion(data, "approval_regulatory")}
              selectedId={selectedId}
              filter={filter}
              onSelect={onSelect}
            />
          </div>
          <div className="col-start-2 row-start-2">
            <CommandRegion
              region={getRegion(data, "command_center")}
              selectedId={selectedId}
              filter={filter}
              onSelect={onSelect}
            />
          </div>
          <div className="col-start-3 row-start-2">
            <ProfessionalRegion
              region={getRegion(data, "professional_service")}
              selectedId={selectedId}
              filter={filter}
              onSelect={onSelect}
            />
          </div>

          <div className="col-span-2 row-start-3">
            <ConstructionSiteRegion
              region={getRegion(data, "construction_site")}
              selectedId={selectedId}
              filter={filter}
              onSelect={onSelect}
            />
          </div>

          <div className="col-start-3 row-start-3">
            <OpeningPrepRegion
              region={getRegion(data, "opening_prep")}
              selectedId={selectedId}
              filter={filter}
              onSelect={onSelect}
            />
          </div>
        </div>
      </div>
    </div>
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
      <aside className="rounded-lg border border-sky-300/15 bg-slate-950/60 p-4 text-sm text-slate-400">
        请选择一个地点查看详情。
      </aside>
    );
  }

  return (
    <aside className="rounded-lg border border-sky-300/20 bg-slate-950/70 p-4 shadow-[0_0_28px_rgba(14,165,233,0.12)] lg:sticky lg:top-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-400">
            {regionName || node.regionId} / {zoneName || node.zoneId}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-sky-50">{node.name}</h2>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md border px-2 py-1 text-xs",
            node.status === "recommended" && "border-yellow-300/40 text-yellow-100",
            node.status === "has_task" && "border-amber-300/40 text-amber-100",
            node.status === "has_event" && "border-rose-300/40 text-rose-100",
            node.status === "completed" && "border-emerald-300/40 text-emerald-100",
            node.status === "locked" && "border-slate-500/25 text-slate-400",
            node.status === "normal" && "border-sky-300/25 text-sky-100",
          )}
        >
          {STATUS_LABELS[node.status]}
        </span>
      </div>

      {node.description ? (
        <p className="mt-3 rounded-md border border-sky-300/10 bg-slate-900/50 p-3 text-sm leading-6 text-slate-300">
          {node.description}
        </p>
      ) : null}

      <DetailSection icon={Users} title="相关 NPC">
        <TokenList items={node.relatedNpcNames} empty="暂无明确 NPC" />
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
          items={
            node.relatedTaskTitles?.length ? node.relatedTaskTitles : node.relatedTaskSlugs
          }
          empty="暂无任务"
        />
      </DetailSection>

      <DetailSection icon={AlertTriangle} title="影响指标">
        <TokenList items={node.impactLabels?.length ? node.impactLabels : node.riskTags} empty="暂无风险标签" />
      </DetailSection>

      <div className="mt-4 grid grid-cols-1 gap-2">
        {node.canEnter && node.href && !node.locked ? (
          <Link
            href={node.href}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-300"
          >
            <DoorOpen className="size-4" />
            进入地点
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-500"
          >
            <Lock className="size-4" />
            进入地点
          </button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/tasks"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-sky-300/20 px-3 py-2 text-sm text-sky-100 hover:border-sky-300/45"
          >
            <ClipboardList className="size-4" />
            查看任务
          </Link>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-sky-300/20 px-3 py-2 text-sm text-sky-100 hover:border-sky-300/45"
          >
            <Eye className="size-4" />
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
      <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-sky-100">
        <Icon className="size-4 text-sky-300" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function TokenList({ items, empty }: { items?: string[]; empty: string }) {
  const normalized = (items || []).filter(Boolean);
  if (normalized.length === 0) return <p className="text-xs text-slate-500">{empty}</p>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {normalized.map((item) => (
        <span
          key={item}
          className="rounded-md border border-sky-300/15 bg-slate-900/65 px-2 py-1 text-xs text-slate-300"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function LocationLegendBar({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: FilterId;
  onFilterChange: (filter: FilterId) => void;
}) {
  return (
    <footer className="flex flex-wrap items-center gap-2 border-t border-sky-400/15 px-4 py-3">
      {FILTERS.map((filter) => {
        const Icon = filter.icon;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition",
              activeFilter === filter.id
                ? "border-sky-300/60 bg-sky-400/15 text-sky-50"
                : "border-sky-300/15 bg-slate-950/35 text-slate-400 hover:text-sky-100",
            )}
          >
            <Icon className="size-3.5" />
            {filter.label}
          </button>
        );
      })}
    </footer>
  );
}

export function LocationSandTablePage({ data }: LocationSandTablePageProps) {
  const nodes = useMemo(() => flattenNodes(data), [data]);
  const defaultNodeId = data.recommendedNode?.id || nodes.find((node) => !node.locked)?.id;
  const [selectedId, setSelectedId] = useState(defaultNodeId);
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const selectedNode = nodes.find((node) => node.id === selectedId) || data.recommendedNode;
  const selectedRegion = data.regions.find((region) =>
    region.zones.some((zone) => zone.nodes.some((node) => node.id === selectedNode?.id)),
  );
  const selectedZone = selectedRegion?.zones.find((zone) =>
    zone.nodes.some((node) => node.id === selectedNode?.id),
  );

  return (
    <section className="overflow-hidden rounded-lg border border-sky-400/20 bg-[#050B14] shadow-[0_0_40px_rgba(14,165,233,0.08)]">
      <LocationTopHud data={data} />
      <div className="grid gap-4 p-3 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-4">
        <div className="min-w-0 rounded-lg border border-sky-400/10 bg-[linear-gradient(180deg,rgba(8,47,73,0.24),rgba(2,6,23,0.75))]">
          <LocationMapCanvas
            data={data}
            selectedId={selectedNode?.id}
            filter={activeFilter}
            onSelect={(node) => setSelectedId(node.id)}
          />
        </div>
        <LocationDetailPanel
          node={selectedNode}
          regionName={selectedRegion?.name}
          zoneName={selectedZone?.name}
        />
      </div>
      <LocationLegendBar activeFilter={activeFilter} onFilterChange={setActiveFilter} />
    </section>
  );
}
