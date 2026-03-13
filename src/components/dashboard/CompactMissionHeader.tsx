"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CelestialOrb } from "@/components/CelestialOrb";
import { cn } from "@/lib/utils";
import { MOCK_LOCATIONS } from "@/lib/mock/locations";
import { MOCK_GEAR } from "@/lib/mock/gear";
import { formatDateTime } from "@/lib/utils";
import type { Mission } from "@/lib/types";
import type { DashboardMissionStatus } from "@/lib/missionStatus";

interface CompactMissionHeaderProps {
  mission: Mission | null;
  missionStatus: DashboardMissionStatus;
  activeLocationId?: string;
  activeGearId?: string;
  /** When provided and status is active, shows Open Mission + Log Results instead of Create */
  activeMission?: Mission | null;
}

const STATUS_LABELS: Record<DashboardMissionStatus, string> = {
  NONE: "No Mission",
  PLANNING: "Planning",
  SETUP: "Setup",
  CAPTURING: "Capturing",
  LOGGING: "Logging",
  COMPLETED: "Completed",
};

export function CompactMissionHeader({
  mission,
  missionStatus,
  activeLocationId,
  activeGearId,
  activeMission,
}: CompactMissionHeaderProps) {
  const isActive =
    missionStatus === "PLANNING" ||
    missionStatus === "SETUP" ||
    missionStatus === "CAPTURING" ||
    missionStatus === "LOGGING";
  const showActiveActions = isActive && activeMission;
  const site =
    MOCK_LOCATIONS.find((l) => l.id === (mission?.locationId ?? activeLocationId)) ?? MOCK_LOCATIONS[0];
  const rig =
    MOCK_GEAR.find((g) => g.id === (mission?.gearId ?? activeGearId)) ?? MOCK_GEAR[0];

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 px-3 py-2 flex flex-wrap items-center justify-between gap-2 relative overflow-hidden">
      {/* Original orb - atmospheric visual in upper-right */}
      <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 pointer-events-none">
        <CelestialOrb size={96} variant="inline" />
      </div>
      <div className="flex flex-wrap items-center gap-3 min-w-0 relative z-10">
        <div>
          <h1 className="font-display text-xs font-medium tracking-[0.04em] text-zinc-200 truncate max-w-[200px] sm:max-w-none">
            {mission?.name ?? "No Active Mission"}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[10px] text-zinc-500">
            <span>{site?.name ?? "—"}</span>
            <span>·</span>
            <span>{rig?.name ?? "—"}</span>
            <span>·</span>
            <span>{mission ? formatDateTime(mission.dateTime) : "—"}</span>
          </div>
        </div>
        <span
          className={cn(
            "dash-pill shrink-0 px-2 py-0.5 rounded",
            missionStatus === "NONE" || missionStatus === "COMPLETED"
              ? "bg-zinc-800/50 text-zinc-500"
              : missionStatus === "CAPTURING" || missionStatus === "LOGGING"
                ? "bg-indigo-500/10 text-indigo-400/90"
                : "bg-indigo-500/10 text-indigo-400/80"
          )}
        >
          {STATUS_LABELS[missionStatus]}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 relative z-10">
        {showActiveActions ? (
          <>
            <Link href={`/missions/${activeMission!.id}`}>
              <Button variant="cta" size="sm">
                Open Mission
              </Button>
            </Link>
            <Link href={`/missions/${activeMission!.id}/log`}>
              <Button variant="secondary" size="sm">
                Log Results
              </Button>
            </Link>
          </>
        ) : (
          <>
            <Link href="/missions/new">
              <Button variant="cta" size="sm">
                Create Mission
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
