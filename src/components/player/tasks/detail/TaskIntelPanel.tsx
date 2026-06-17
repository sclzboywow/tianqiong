import type { TaskDetailViewData } from "@/game/taskDetailPresentationEngine";
import { playerCardBodyClass, playerCardClass, playerCardHeaderClass } from "../../playerTheme";

type TaskIntelPanelProps = {
  data: TaskDetailViewData;
};

export function TaskIntelPanel({ data }: TaskIntelPanelProps) {
  return (
    <section className={playerCardClass}>
      <div className={playerCardHeaderClass}>
        <h3 className="text-base font-semibold text-[#EAF3FF]">任务情报</h3>
      </div>
      <div className={`${playerCardBodyClass} space-y-4`}>
        <p className="text-[13px] leading-relaxed text-[#8EA3B8] lg:text-sm">
          {data.description || "暂无任务说明。"}
        </p>

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[#8EA3B8]">所属区域</dt>
            <dd className="mt-0.5 text-[#EAF3FF]">{data.area}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#8EA3B8]">结算模式</dt>
            <dd className="mt-0.5 text-[#EAF3FF]">{data.resolutionModeLabel}</dd>
          </div>
          <div>
            <dt className="text-xs text-[#8EA3B8]">基础成功率</dt>
            <dd className="mt-0.5 text-[#EAF3FF]">{Math.round(data.baseSuccessRate)}%</dd>
          </div>
          <div>
            <dt className="text-xs text-[#8EA3B8]">参与人数</dt>
            <dd className="mt-0.5 text-[#EAF3FF]">
              {data.participantCount}/{data.requiredCount} 人
            </dd>
          </div>
          {data.minResolveCount > 1 && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-[#8EA3B8]">提交进度</dt>
              <dd className="mt-0.5 text-[#EAF3FF]">
                {data.submittedCount}/{data.minResolveCount} 人已提交
              </dd>
            </div>
          )}
        </dl>

        {data.requiredJobLabels.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-[#8EA3B8]">推荐岗位</p>
            <div className="flex flex-wrap gap-2">
              {data.requiredJobLabels.map((job) => (
                <span
                  key={job}
                  className="rounded-md border border-[rgba(60,160,255,0.18)] px-2 py-0.5 text-xs text-[#EAF3FF]"
                >
                  {job}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.participants.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-[#8EA3B8]">参与成员</p>
            <ul className="space-y-1.5 text-xs text-[#8EA3B8]">
              {data.participants.map((participant) => (
                <li key={participant.id}>
                  {participant.nickname} · {participant.jobLabel}
                  {participant.hasSubmitted ? " · 已提交" : " · 未提交"}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
