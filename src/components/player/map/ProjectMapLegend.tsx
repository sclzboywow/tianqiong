import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

const LEGEND_ITEMS = [
  { color: "bg-zinc-600", label: "灰色：未解锁" },
  { color: "bg-[#1E88FF]", label: "蓝色：已解锁" },
  { color: "bg-[#FACC15]", label: "黄色：有待办 / 推荐" },
  { color: "bg-[#EF4444]", label: "红色：高风险标签" },
  { color: "border border-[#FACC15] bg-transparent", label: "推荐：今日建议前往" },
  { color: "bg-[rgba(30,136,255,0.5)]", label: "NPC：该地点有关联角色" },
];

export function ProjectMapLegend() {
  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <h3 className="text-sm font-semibold text-[#EAF3FF]">图例</h3>
      </div>
      <div className={`${playerCardBodyClass} flex flex-wrap gap-x-4 gap-y-2`}>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-[#8EA3B8]">
            <span className={`size-2.5 shrink-0 rounded-full ${item.color}`} />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}
