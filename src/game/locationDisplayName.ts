import { MAP_LOCATIONS } from "@/data/locations";
import { LOCATION_SANDTABLE_AREAS } from "@/data/locationSandtableAreas";

const REGION_SHORT_LABELS: Record<string, string> = {
  owner_hub: "业主",
  command_center: "项目部",
  approval_regulatory: "审批监管",
  professional_service: "专业服务区",
  construction_site: "施工现场",
  opening_prep: "开业筹备",
};

export function getLocationDisplayNameById(locationId: string): string {
  const mapLocation = MAP_LOCATIONS.find((location) => location.id === locationId);
  if (mapLocation) {
    return mapLocation.name.replace(/^建设主体/u, "业主");
  }

  const area = LOCATION_SANDTABLE_AREAS.find((item) => item.id === locationId);
  if (area) {
    const regionLabel = REGION_SHORT_LABELS[area.regionId] ?? area.regionId;
    return `${regionLabel}·${area.name}`;
  }

  return locationId;
}
