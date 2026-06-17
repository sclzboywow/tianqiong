import { getRecentLocationActionLogs } from "@/game/logEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../playerTheme";

type LocationRecentActivityPanelProps = {
  locationId: string;
  locationName: string;
  maxItems?: number;
};

function formatLogTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function stripLogPrefix(content: string): string {
  return content.replace(/^【协同地图】/, "").replace(/^【事件池】/, "").trim();
}

export async function LocationRecentActivityPanel({
  locationId,
  locationName,
  maxItems = 5,
}: LocationRecentActivityPanelProps) {
  const logs = await getRecentLocationActionLogs({ id: locationId, name: locationName }, maxItems);

  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">最近地点动态</h3>
      </div>
      <div className={playerCardBodyClass}>
        {logs.length === 0 ? (
          <p className="text-sm text-[#8EA3B8]">当前地点暂无行动记录。</p>
        ) : (
          <ul className="space-y-2.5">
            {logs.map((log) => (
              <li
                key={log.id}
                className="rounded-lg border border-[rgba(60,160,255,0.1)] bg-[rgba(5,11,20,0.35)] px-3 py-2.5 text-[13px] leading-relaxed text-[#EAF3FF]/90"
              >
                <p>{stripLogPrefix(log.content)}</p>
                <p className="mt-1 text-[11px] text-[#8EA3B8]">{formatLogTime(log.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
