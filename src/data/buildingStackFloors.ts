/** 楼栋垂直空间：从下到上的物理楼层顺序 */
type BuildingStackFloorDef = {
  id: string;
  name: string;
  shortName: string;
  relatedLocationSlugs?: readonly string[];
};

export const BUILDING_STACK_FLOORS: readonly BuildingStackFloorDef[] = [
  { id: "area_site_b2", name: "B2 · 地下二层", shortName: "B2" },
  {
    id: "area_site_b1",
    name: "B1 · 地下一层",
    shortName: "B1",
    relatedLocationSlugs: ["site_b1_mep_corridor"],
  },
  {
    id: "area_site_1f",
    name: "L1 · 首层",
    shortName: "L1",
    relatedLocationSlugs: ["site_l1_commercial_street"],
  },
  { id: "area_site_2f", name: "2F · 二层", shortName: "2F" },
  { id: "area_site_3f", name: "3F · 三层", shortName: "3F" },
  { id: "area_site_4f", name: "4F · 四层", shortName: "4F" },
  { id: "area_site_5f", name: "5F · 五层", shortName: "5F" },
  { id: "area_site_6f", name: "6F · 六层", shortName: "6F" },
  { id: "area_site_7f", name: "7F · 七层", shortName: "7F" },
  { id: "area_site_8f", name: "8F · 八层", shortName: "8F" },
  { id: "area_site_9f", name: "9F · 九层", shortName: "9F" },
  { id: "area_site_10f", name: "10F · 十层", shortName: "10F" },
  { id: "area_site_roof_floor", name: "屋面 · RF", shortName: "RF" },
];

/** 中间栏 UI 渲染顺序：从上到下（屋面向下至 B2） */
export const BUILDING_STACK_UI_ORDER: string[] = [...BUILDING_STACK_FLOORS]
  .reverse()
  .map((floor) => floor.relatedLocationSlugs?.[0] ?? floor.id);

export const BUILDING_STACK_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  BUILDING_STACK_FLOORS.flatMap((floor) => {
    const entries: [string, string][] = [[floor.id, floor.name]];
    for (const slug of floor.relatedLocationSlugs ?? []) {
      entries.push([slug, floor.name]);
    }
    return entries;
  }),
);
