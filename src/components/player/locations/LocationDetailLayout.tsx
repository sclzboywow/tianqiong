import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { LocationOverview } from "@/game/locationEngine";
import type { LocationActionDisplayItem } from "@/game/locationPresentationEngine";
import { LocationDetailHeader, LocationIntelExtras } from "./LocationIntelPanel";
import { LocationActionExecutePanel } from "./LocationActionExecutePanel";
import { LocationRecentActivityPanel } from "./LocationRecentActivityPanel";

type LocationDetailLayoutProps = {
  overview: LocationOverview;
  stageName: string;
  actionItems: LocationActionDisplayItem[];
  user: {
    stamina: number;
    spirit: number;
    level: number;
    reputation: number;
  };
};

export function LocationDetailLayout({
  overview,
  stageName,
  actionItems,
  user,
}: LocationDetailLayoutProps) {
  return (
    <div className="space-y-4 lg:space-y-5">
      <Link
        href="/locations"
        className="inline-flex items-center gap-1 text-sm text-[#8EA3B8] hover:text-[#2EA8FF]"
      >
        <ChevronLeft className="size-4" />
        返回协同地图
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="space-y-4 lg:col-span-5">
          <LocationDetailHeader overview={overview} stageName={stageName} />
          <div className="hidden lg:block">
            <LocationIntelExtras overview={overview} />
          </div>
        </div>

        <div className="lg:col-span-7">
          <LocationActionExecutePanel
            locationId={overview.location.id}
            actions={actionItems}
            user={user}
            unlocked={overview.unlocked}
          />
        </div>

        <div className="lg:hidden">
          <LocationIntelExtras overview={overview} />
        </div>
      </div>

      <LocationRecentActivityPanel
        locationId={overview.location.id}
        locationName={overview.location.name}
      />
    </div>
  );
}
