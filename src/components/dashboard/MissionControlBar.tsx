"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { formatDateTime } from "@/lib/utils";
import type { Mission } from "@/lib/types";
import type { DashboardMissionStatus } from "@/lib/missionStatus";

interface MissionControlBarProps {
  mission: Mission | null;
  missionStatus: DashboardMissionStatus;
  activeLocationId?: string;
  activeGearId?: string;
  onQuickMission?: () => void;
  /** When false, actions (Create Mission, Quick Mission) are not rendered - for use in grid with separate Actions card */
  showActions?: boolean;
}

const STATUS_LABELS: Record<DashboardMissionStatus, string> = {
  NONE: "No Mission",
  PLANNING: "Planning",
  SETUP: "Setup",
  CAPTURING: "Capturing",
  LOGGING: "Logging",
  COMPLETED: "Completed",
};

export function MissionControlBar({
  mission,
  missionStatus,
  activeLocationId,
  activeGearId,
  onQuickMission,
  showActions = true,
}: MissionControlBarProps) {
  const site =
    MOCK_LOCATIONS.find(
      (l) => l.id === (mission?.locationId ?? activeLocationId),
    ) ?? MOCK_LOCATIONS[0];
  const rig =
    MOCK_GEAR.find((g) => g.id === (mission?.gearId ?? activeGearId)) ??
    MOCK_GEAR[0];

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-3 py-1.5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-4 min-w-0">
        <span className="dash-section-title text-zinc-500 shrink-0">
          Mission Control
        </span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[10px]">
          <span className="shrink-0">
            <span className="dash-pill text-zinc-500">Status</span>
            <span
              className={cn(
                "ml-1.5 dash-metric",
                missionStatus === "NONE" || missionStatus === "COMPLETED"
                  ? "text-zinc-500"
                  : "text-zinc-300",
              )}
            >
              {STATUS_LABELS[missionStatus]}
            </span>
          </span>
          {mission?.name && (
            <span className="shrink-0 truncate max-w-[140px]">
              <span className="dash-pill text-zinc-500">Mission</span>
              <span className="ml-1.5 text-zinc-400 truncate">
                {mission.name}
              </span>
            </span>
          )}
          <span className="shrink-0">
            <span className="dash-pill text-zinc-500">Site</span>
            <span className="ml-1.5 text-zinc-400">{site?.name ?? "—"}</span>
          </span>
          <span className="shrink-0">
            <span className="dash-pill text-zinc-500">Rig</span>
            <span className="ml-1.5 text-zinc-400">{rig?.name ?? "—"}</span>
          </span>
          <span className="shrink-0">
            <span className="dash-pill text-zinc-500">Date</span>
            <span className="ml-1.5 text-zinc-400">
              {mission ? formatDateTime(mission.dateTime) : "Tonight"}
            </span>
          </span>
        </div>
      </div>
      {showActions && onQuickMission && (
        <div className="flex items-center gap-1.5 shrink-0">
          <Link href="/missions/new">
            <Button variant="cta" size="sm" className="h-7 text-xs">
              Create Mission
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            className="h-7 text-xs"
            onClick={onQuickMission}
          >
            Quick Mission
          </Button>
        </div>
      )}
    </div>
  );
}
