export type PlayerNavItem = {
  href: string;
  label: string;
  shortLabel?: string;
};

/** 玩家端底部/顶部导航项（不含后台入口） */
export const PLAYER_NAV_ITEMS: PlayerNavItem[] = [
  { href: "/project", label: "指挥中心", shortLabel: "指挥中心" },
  { href: "/locations", label: "探索", shortLabel: "探索" },
  { href: "/tasks", label: "任务", shortLabel: "任务" },
  { href: "/profile", label: "角色", shortLabel: "角色" },
];
