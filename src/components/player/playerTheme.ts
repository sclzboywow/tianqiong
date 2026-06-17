/** 玩家端 HUD 设计 token（PC 指挥中心） */
export const playerHud = {
  bg: "#050B14",
  bgElevated: "#07111F",
  card: "rgba(10, 24, 40, 0.78)",
  border: "rgba(60, 160, 255, 0.22)",
  primary: "#1E88FF",
  primaryBright: "#2EA8FF",
  success: "#22C55E",
  warning: "#FACC15",
  danger: "#EF4444",
  text: "#EAF3FF",
  textMuted: "#8EA3B8",
} as const;

export const PLAYER_STAMINA_MAX = 100;
export const PLAYER_SPIRIT_MAX = 100;

export const playerCardClass =
  "rounded-xl border border-[rgba(60,160,255,0.22)] bg-[rgba(10,24,40,0.78)] backdrop-blur-sm";

export const playerCardHeaderClass = "px-5 pt-4 pb-2";
export const playerCardBodyClass = "px-5 pb-5";
