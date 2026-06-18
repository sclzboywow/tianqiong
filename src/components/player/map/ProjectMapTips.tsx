import { cn } from "@/lib/utils";

type ProjectMapTipsProps = {
  className?: string;
};

export function ProjectMapTips({ className }: ProjectMapTipsProps) {
  return (
    <p
      className={cn(
        "pointer-events-none rounded-lg border border-[rgba(60,160,255,0.15)] bg-[rgba(5,11,20,0.65)] px-3 py-1.5 text-[11px] text-[#8EA3B8] backdrop-blur-md sm:text-xs",
        className,
      )}
    >
      滚轮缩放 · 拖动画布 · 点击节点进入地点工作台
    </p>
  );
}
