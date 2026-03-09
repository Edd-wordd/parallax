"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getBestTargetForSpotlight } from "@/lib/mock/dashboardData";
import { cn } from "@/lib/utils";

interface ObjectSpotlightCardConstraints {
  minAltitude: number;
  moonTolerance: number;
  targetTypes: string[];
  driveToDarker?: boolean;
  driveRadius?: number;
}

interface ObjectSpotlightCardProps {
  activeLocationId: string;
  activeGearId: string;
  dateTime: string;
  constraints: ObjectSpotlightCardConstraints;
}

/** Placeholder for mock astronomy imagery. Replace with real image URL when API wired. */
function NebulaPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden bg-gradient-to-br from-zinc-900 via-indigo-950/30 to-zinc-900",
        "relative flex items-center justify-center",
        className
      )}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 40% 50%, rgba(80, 100, 180, 0.2) 0%, transparent 60%),
            radial-gradient(ellipse 30% 40% at 70% 40%, rgba(120, 80, 140, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 20% 30% at 25% 60%, rgba(60, 90, 150, 0.12) 0%, transparent 40%)
          `,
        }}
      />
      <div className="relative w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-indigo-400/30" />
      </div>
    </div>
  );
}

/** Object Spotlight: best target for site + rig + date. Refreshes on site, date, rig change. */
export function ObjectSpotlightCard({
  activeLocationId,
  activeGearId,
  dateTime,
  constraints,
}: ObjectSpotlightCardProps) {
  const rec = useMemo(
    () =>
      getBestTargetForSpotlight(
        activeLocationId,
        activeGearId,
        dateTime,
        {
          ...constraints,
          driveRadius: constraints.driveToDarker ? constraints.driveRadius : undefined,
        }
      ),
    [
      activeLocationId,
      activeGearId,
      dateTime,
      constraints.minAltitude,
      constraints.moonTolerance,
      constraints.targetTypes,
      constraints.driveToDarker,
      constraints.driveRadius,
    ]
  );

  if (!rec) {
    return (
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden">
        <div className="px-3 py-2 border-b border-zinc-800/60">
          <h2 className="dash-section-title">Object Spotlight</h2>
        </div>
        <div className="p-4 text-center">
          <p className="text-xs text-zinc-500">No recommended target for this site and date.</p>
        </div>
      </div>
    );
  }

  const t = rec.target;
  const description =
    `A stellar nursery 1,344 ly away. Prime tonight with moon setting. Best window ${rec.best_window_start}–${rec.best_window_end}.`;
  const observationNote = `Peak altitude ${rec.peak_altitude}°. Moon ${rec.moon_separation}° away.`;

  return (
    <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-800/60">
        <h2 className="dash-section-title">Object Spotlight</h2>
      </div>
      <Link href={`/targets/${t.id}`} className="block group">
        <div className="p-3">
          <div className="flex gap-3">
            <NebulaPlaceholder className="w-24 h-24 shrink-0 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-sm font-semibold text-indigo-400/90 group-hover:text-indigo-400 truncate">
                {t.name}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {t.type} · Mag {t.magnitude} · {t.angular_size}&apos; · {t.constellation}
              </p>
              <p className="text-sm text-zinc-400 mt-2 line-clamp-2 leading-snug">
                {description}
              </p>
              <p className="text-xs text-amber-400/80 mt-2 dash-pill">
                {observationNote}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
