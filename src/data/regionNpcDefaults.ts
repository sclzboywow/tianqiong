import type { LocationRegionId } from "@/game/locationSandtablePresentationEngine";

export type RegionNpcDefault = {
  regionId: LocationRegionId;
  npcIds: string[];
};

export const REGION_NPC_DEFAULTS: RegionNpcDefault[] = [
  {
    "regionId": "owner_hub",
    "npcIds": [
      "owner_project_director",
      "owner_project_coordinator"
    ]
  },
  {
    "regionId": "command_center",
    "npcIds": [
      "contractor_project_manager",
      "chief_supervisor"
    ]
  },
  {
    "regionId": "approval_regulatory",
    "npcIds": [
      "government_window_officer",
      "housing_bureau_officer"
    ]
  },
  {
    "regionId": "professional_service",
    "npcIds": [
      "design_lead",
      "cost_consultant_lead"
    ]
  },
  {
    "regionId": "construction_site",
    "npcIds": [
      "contractor_production_manager",
      "site_safety_officer",
      "floor_construction_worker"
    ]
  },
  {
    "regionId": "opening_prep",
    "npcIds": [
      "owner_operation_prep_lead",
      "property_engineering_manager"
    ]
  }
];

export function getDefaultNpcIdsByRegion(regionId: LocationRegionId): string[] {
  return REGION_NPC_DEFAULTS.find((item) => item.regionId === regionId)?.npcIds ?? [];
}
